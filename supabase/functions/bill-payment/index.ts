import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const SMEPLUG_BASE = "https://smeplug.ng/api/v1";

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

    const body = await req.json();
    const { service_type, provider, smart_card_number, meter_number, meter_type, amount, plan_id, phone } = body;

    if (!service_type || !["cable", "electricity"].includes(service_type)) {
      return new Response(JSON.stringify({ error: "Invalid service type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      return new Response(JSON.stringify({ error: "VTU service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const reference = `QP-BILL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
      metadata: { provider, smart_card_number, meter_number, meter_type, plan_id, phone },
    });

    let smeplugUrl: string;
    let smeplugBody: Record<string, unknown>;

    if (service_type === "cable") {
      smeplugUrl = `${SMEPLUG_BASE}/cable/purchase`;
      smeplugBody = {
        provider,
        smart_card_number,
        plan_id,
        phone: phone || "08000000000",
      };
    } else {
      smeplugUrl = `${SMEPLUG_BASE}/electricity/purchase`;
      smeplugBody = {
        provider,
        meter_number,
        meter_type: meter_type || "prepaid",
        amount,
        phone: phone || "08000000000",
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
        message: `${service_type === "cable" ? "Cable TV" : "Electricity"} payment successful`,
        reference,
        token: vtuData.data?.token || null,
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
        message: vtuData.message || "Payment failed",
        reference,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Bill payment error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
