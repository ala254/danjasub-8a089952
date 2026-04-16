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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
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

    // Validate inputs
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

    // Validate phone number format
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

    // Duplicate prevention: check for same user+type+phone+amount in last 60s
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentTx } = await serviceClient
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", service_type)
      .gte("created_at", oneMinAgo)
      .in("status", ["pending", "success"])
      .limit(1);

    if (recentTx && recentTx.length > 0) {
      // Check if it matches same phone/amount via metadata
      const { data: dupCheck } = await serviceClient
        .from("transactions")
        .select("id, metadata")
        .eq("user_id", user.id)
        .eq("type", service_type)
        .eq("amount", amount)
        .gte("created_at", oneMinAgo)
        .in("status", ["pending", "success"])
        .limit(1);

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
    }

    // Check wallet balance
    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || Number(wallet.balance) < amount) {
      return new Response(JSON.stringify({ error: "Insufficient wallet balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `QP-VTU-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Deduct wallet balance
    const newBalance = Number(wallet.balance) - amount;
    await serviceClient.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

    // Create pending transaction
    await serviceClient.from("transactions").insert({
      user_id: user.id,
      type: service_type,
      amount,
      status: "pending",
      reference,
      metadata: { network, phone, plan_id },
    });

    // Call SMEPlug API
    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      await serviceClient.from("wallets").update({ balance: Number(wallet.balance) }).eq("user_id", user.id);
      await serviceClient.from("transactions").update({ status: "failed" }).eq("reference", reference);
      return new Response(JSON.stringify({ error: "VTU service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const networkMap: Record<string, number> = {
      mtn: 1, airtel: 2, glo: 3, "9mobile": 4,
    };

    let smeplugUrl: string;
    let smeplugBody: Record<string, unknown>;

    if (service_type === "airtime") {
      smeplugUrl = "https://smeplug.ng/api/v1/airtime/purchase";
      smeplugBody = {
        network_id: networkMap[network] || 1,
        phone,
        amount,
      };
    } else {
      smeplugUrl = "https://smeplug.ng/api/v1/data/purchase";
      smeplugBody = {
        network_id: networkMap[network] || 1,
        phone,
        plan_id,
      };
    }

    const vtuRes = await fetch(smeplugUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${smeplugKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smeplugBody),
    });

    const vtuData = await vtuRes.json();

    if (vtuData.status === "success" || vtuData.status === true) {
      await serviceClient.from("transactions").update({
        status: "success",
        provider: "smeplug",
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      return new Response(JSON.stringify({
        status: "success",
        message: `${service_type === "airtime" ? "Airtime" : "Data"} purchased successfully`,
        reference,
        amount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Refund on failure
      await serviceClient.from("wallets").update({ balance: Number(wallet.balance) }).eq("user_id", user.id);
      await serviceClient.from("transactions").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      return new Response(JSON.stringify({
        status: "failed",
        message: vtuData.message || "VTU purchase failed",
        reference,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("VTU error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
