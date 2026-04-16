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

    // Check admin role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transaction_id } = await req.json();
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Transaction ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get failed transaction
    const { data: tx } = await serviceClient
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("status", "failed")
      .single();

    if (!tx) {
      return new Response(JSON.stringify({ error: "Failed transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = (tx.metadata as Record<string, unknown>) || {};
    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      return new Response(JSON.stringify({ error: "VTU service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const networkMap: Record<string, number> = { mtn: 1, airtel: 2, glo: 3, "9mobile": 4 };

    let smeplugUrl: string;
    let smeplugBody: Record<string, unknown>;

    switch (tx.type) {
      case "airtime":
        smeplugUrl = `${SMEPLUG_BASE}/airtime/purchase`;
        smeplugBody = {
          network_id: networkMap[(meta.network as string) || ""] || 1,
          phone: meta.phone,
          amount: tx.amount,
        };
        break;
      case "data":
        smeplugUrl = `${SMEPLUG_BASE}/data/purchase`;
        smeplugBody = {
          network_id: networkMap[(meta.network as string) || ""] || 1,
          phone: meta.phone,
          plan_id: meta.plan_id,
        };
        break;
      case "cable":
        smeplugUrl = `${SMEPLUG_BASE}/cable/purchase`;
        smeplugBody = {
          provider: meta.provider,
          smart_card_number: meta.smart_card_number,
          plan_id: meta.plan_id,
          phone: (meta.phone as string) || "08000000000",
        };
        break;
      case "electricity":
        smeplugUrl = `${SMEPLUG_BASE}/electricity/purchase`;
        smeplugBody = {
          provider: meta.provider,
          meter_number: meta.meter_number,
          meter_type: meta.meter_type || "prepaid",
          amount: tx.amount,
          phone: (meta.phone as string) || "08000000000",
        };
        break;
      default:
        return new Response(JSON.stringify({ error: "Unsupported transaction type for retry" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Mark as pending
    await serviceClient.from("transactions").update({
      status: "pending",
      updated_at: new Date().toISOString(),
    }).eq("id", transaction_id);

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
      }).eq("id", transaction_id);

      return new Response(JSON.stringify({ status: "success", message: "Transaction retried successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      await serviceClient.from("transactions").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", transaction_id);

      return new Response(JSON.stringify({ status: "failed", message: vtuData.message || "Retry failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Retry error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
