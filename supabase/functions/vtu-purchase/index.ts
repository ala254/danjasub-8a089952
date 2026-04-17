import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { service_type, network, phone, amount, plan_id } = await req.json();

    if (!service_type || !["airtime", "data"].includes(service_type)) {
      return new Response(JSON.stringify({ error: "Invalid service type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!network || !phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneRegex = /^0[789][01]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Block suspended users
    const { data: suspendedRes } = await serviceClient.rpc("is_user_suspended", { _user_id: user.id });
    if (suspendedRes === true) {
      return new Response(JSON.stringify({ error: "Your account is suspended. Please contact support." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check service toggles + transaction charge
    const { data: settings } = await serviceClient.from("app_settings").select("*").limit(1).maybeSingle();
    if (settings) {
      if (service_type === "airtime" && !settings.airtime_enabled) {
        return new Response(JSON.stringify({ error: "Airtime service is currently disabled" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (service_type === "data" && !settings.data_enabled) {
        return new Response(JSON.stringify({ error: "Data service is currently disabled" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== Compute selling price (final amount user pays) and cost (sent to SMEPlug) =====
    let sellingPrice = Number(amount);
    let costPrice = Number(amount);

    if (service_type === "data" && plan_id) {
      const { data: priceRow } = await serviceClient
        .from("data_plan_pricing")
        .select("cost_price, selling_price, is_active")
        .eq("network", network)
        .eq("plan_id", String(plan_id))
        .maybeSingle();
      if (priceRow && priceRow.is_active) {
        sellingPrice = Number(priceRow.selling_price);
        costPrice = Number(priceRow.cost_price);
      }
    } else if (service_type === "airtime") {
      const { data: airPrice } = await serviceClient
        .from("airtime_pricing")
        .select("markup_percent, is_active")
        .eq("network", network)
        .maybeSingle();
      // For airtime, client sends face value (e.g. ₦100). Apply markup so user pays more.
      // Cost to us = face value (what SMEPlug charges)
      costPrice = Number(amount);
      const markup = airPrice && airPrice.is_active ? Number(airPrice.markup_percent) : 0;
      sellingPrice = Math.round(costPrice * (1 + markup / 100));
    }

    const charge = settings?.transaction_charge ? Number(settings.transaction_charge) : 0;
    const totalDebit = sellingPrice + charge;

    // Duplicate prevention
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    const { data: dupCheck } = await serviceClient
      .from("transactions")
      .select("id, metadata")
      .eq("user_id", user.id)
      .eq("type", service_type)
      .eq("amount", totalDebit)
      .gte("created_at", oneMinAgo)
      .in("status", ["pending", "success"])
      .limit(5);

    const isDup = dupCheck?.some((t) => {
      const m = t.metadata as Record<string, unknown>;
      return m?.phone === phone;
    });
    if (isDup) {
      return new Response(JSON.stringify({ error: "Duplicate transaction detected. Please wait before retrying." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check wallet balance against selling price + charge
    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || Number(wallet.balance) < totalDebit) {
      return new Response(JSON.stringify({ error: "Insufficient wallet balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `QP-VTU-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newBalance = Number(wallet.balance) - totalDebit;
    await serviceClient.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

    await serviceClient.from("transactions").insert({
      user_id: user.id,
      type: service_type,
      amount: totalDebit,
      status: "pending",
      reference,
      provider: "smeplug",
      metadata: {
        network, phone, plan_id,
        cost_price: costPrice,
        selling_price: sellingPrice,
        charge,
        profit: sellingPrice - costPrice,
        timestamp: new Date().toISOString(),
      },
    });

    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      await serviceClient.from("wallets").update({ balance: Number(wallet.balance) }).eq("user_id", user.id);
      await serviceClient.from("transactions").update({ status: "failed" }).eq("reference", reference);
      return new Response(JSON.stringify({ error: "VTU service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const networkMap: Record<string, number> = { mtn: 1, airtel: 2, glo: 3, "9mobile": 4 };

    let smeplugUrl: string;
    let smeplugBody: Record<string, unknown>;

    if (service_type === "airtime") {
      smeplugUrl = "https://smeplug.ng/api/v1/airtime/purchase";
      smeplugBody = { network_id: networkMap[network] || 1, phone, amount: costPrice };
    } else {
      smeplugUrl = "https://smeplug.ng/api/v1/data/purchase";
      smeplugBody = { network_id: networkMap[network] || 1, phone, plan_id };
    }

    const vtuRes = await fetch(smeplugUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${smeplugKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(smeplugBody),
    });
    const vtuData = await vtuRes.json();
    const successMessage = vtuData.message || `${service_type === "airtime" ? "Airtime" : "Data"} purchased successfully`;

    if (vtuData.status === "success" || vtuData.status === true) {
      await serviceClient.from("transactions").update({
        status: "success",
        updated_at: new Date().toISOString(),
        metadata: {
          network, phone, plan_id,
          cost_price: costPrice, selling_price: sellingPrice, charge,
          profit: sellingPrice - costPrice,
          api_response: vtuData, api_message: successMessage,
          timestamp: new Date().toISOString(),
        },
      }).eq("reference", reference);

      return new Response(JSON.stringify({
        status: "success", message: successMessage, reference, amount: totalDebit,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      await serviceClient.from("wallets").update({ balance: Number(wallet.balance) }).eq("user_id", user.id);
      const failMessage = vtuData.message || "VTU purchase failed";
      await serviceClient.from("transactions").update({
        status: "failed",
        updated_at: new Date().toISOString(),
        metadata: {
          network, phone, plan_id,
          cost_price: costPrice, selling_price: sellingPrice, charge,
          api_response: vtuData, api_message: failMessage,
          timestamp: new Date().toISOString(),
        },
      }).eq("reference", reference);

      return new Response(JSON.stringify({
        status: "failed", message: failMessage, reference,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    console.error("VTU error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
