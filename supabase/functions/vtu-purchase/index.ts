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

    const { service_type, network, phone, amount, plan_id, wallet_pin } = await req.json();

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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify wallet PIN
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("wallet_pin")
      .eq("id", user.id)
      .single();

    if (profile?.wallet_pin && profile.wallet_pin !== wallet_pin) {
      return new Response(JSON.stringify({ error: "Invalid wallet PIN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Deduct wallet balance first
    const newBalance = Number(wallet.balance) - amount;
    await serviceClient.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);

    // Create pending transaction
    await serviceClient.from("transactions").insert({
      user_id: user.id,
      type: service_type,
      title: `${network.toUpperCase()} ${service_type === "airtime" ? "Airtime" : "Data"}`,
      description: phone,
      amount,
      status: "pending",
      reference,
      meta: { network, phone, plan_id },
    });

    // Call SMEPlug API
    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      // Refund and mark failed
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
        plan_id: plan_id,
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
        provider_reference: vtuData.data?.transaction_id?.toString() || "",
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
