import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      return new Response("Not configured", { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = createHmac("sha512", paystackKey).update(body).digest("hex");
    if (hash !== signature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;
      const userId = metadata?.user_id;
      const amountInNaira = amount / 100;

      if (!userId || !reference) {
        return new Response("Missing data", { status: 400 });
      }

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Check if already processed
      const { data: tx } = await serviceClient
        .from("transactions")
        .select("status")
        .eq("reference", reference)
        .single();

      if (tx?.status === "success") {
        return new Response("Already processed", { status: 200 });
      }

      // Update transaction
      await serviceClient.from("transactions").update({
        status: "success",
        provider_reference: event.data.id?.toString(),
        updated_at: new Date().toISOString(),
      }).eq("reference", reference);

      // Credit wallet
      const { data: wallet } = await serviceClient
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (wallet) {
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + amountInNaira })
          .eq("user_id", userId);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500 });
  }
});
