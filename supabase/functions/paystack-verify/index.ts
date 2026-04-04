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

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });

    const verifyData = await verifyRes.json();
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (verifyData.data?.status === "success") {
      const amountInNaira = verifyData.data.amount / 100;

      // Update transaction status
      await serviceClient.from("transactions").update({
        status: "success",
        provider_reference: verifyData.data.id?.toString(),
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      // Credit wallet
      const { data: wallet } = await serviceClient
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (wallet) {
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + amountInNaira })
          .eq("user_id", user.id);
      }

      return new Response(JSON.stringify({
        status: "success",
        amount: amountInNaira,
        reference,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      await serviceClient.from("transactions").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      return new Response(JSON.stringify({
        status: "failed",
        message: verifyData.data?.gateway_response || "Payment verification failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
