import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const SMEPLUG_BASE = "https://smeplug.ng/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const smeplugKey = Deno.env.get("SMEPLUG_API_KEY");
    if (!smeplugKey) {
      return new Response(JSON.stringify({ error: "VTU service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const service = url.searchParams.get("service"); // data, cable, electricity
    const network = url.searchParams.get("network"); // for data plans

    let apiUrl: string;

    switch (service) {
      case "data":
        apiUrl = `${SMEPLUG_BASE}/data/plans`;
        break;
      case "cable":
        apiUrl = `${SMEPLUG_BASE}/cable/plans`;
        break;
      case "electricity":
        apiUrl = `${SMEPLUG_BASE}/electricity/providers`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid service type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${smeplugKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Plans fetch error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch plans" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
