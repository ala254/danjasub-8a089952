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

    const { amount, email } = await req.json();

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

    // Enforce admin minimum funding amount
    const { data: settings } = await serviceClient.from("app_settings").select("min_funding_amount").limit(1).maybeSingle();
    const minAmount = settings?.min_funding_amount ? Number(settings.min_funding_amount) : 100;

    if (!amount || amount < minAmount) {
      return new Response(JSON.stringify({ error: `Minimum amount is ₦${minAmount}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `QP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackKey) {
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await serviceClient.from("transactions").insert({
      user_id: user.id,
      type: "fund",
      amount: amount,
      status: "pending",
      reference,
    });

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || user.email,
        amount: amount * 100,
        reference,
        callback_url: `${req.headers.get("origin")}/payment/verify?reference=${reference}`,
        metadata: {
          user_id: user.id,
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: user.id },
          ],
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Payment initialization failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      access_code: paystackData.data.access_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("paystack-initialize error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
