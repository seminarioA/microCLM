import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCatalogContext, buildGroqRequestBody, buildLeadContext, parseGroqInsight } from "./generateLeadInsight.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { leadId, createdBy } = await req.json();

    if (!leadId || typeof leadId !== "string") {
      return json({ error: "leadId es obligatorio" }, 400);
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return json({ error: "Falta configurar GROQ_API_KEY en los secrets del proyecto" }, 500);
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(
        "id, sector, value, stage:pipeline_stages(label), contact:contacts(full_name, role_title), company:companies(name)",
      )
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return json({ error: leadError?.message ?? "Lead no encontrado" }, 404);
    }

    const { data: sectorRow } = await supabase.from("sectors").select("label").eq("key", lead.sector ?? "").maybeSingle();

    const { data: timeline } = await supabase
      .from("timeline_events")
      .select("title, description, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, description, category, price")
      .eq("status", "active");

    const contact = Array.isArray(lead.contact) ? lead.contact[0] : lead.contact;
    const company = Array.isArray(lead.company) ? lead.company[0] : lead.company;
    const stage = Array.isArray(lead.stage) ? lead.stage[0] : lead.stage;

    const leadContext = buildLeadContext({
      contactName: contact?.full_name ?? "Sin nombre",
      roleTitle: contact?.role_title ?? null,
      companyName: company?.name ?? "Sin empresa",
      sectorLabel: sectorRow?.label ?? lead.sector ?? "Sin rubro",
      stageLabel: stage?.label ?? "Sin etapa",
      dealValue: lead.value,
      timelineSummaries: (timeline ?? []).map((t) => `${t.title}${t.description ? `: ${t.description}` : ""}`),
    });

    const catalogProducts = products ?? [];
    const catalogContext = buildCatalogContext(catalogProducts);
    const requestBody = buildGroqRequestBody(leadContext, catalogContext);

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      return json({ error: groqData?.error?.message ?? "Error al llamar a Groq" }, 502);
    }

    const rawText = groqData?.choices?.[0]?.message?.content;
    if (typeof rawText !== "string") {
      return json({ error: "Groq no devolvió contenido analizable" }, 502);
    }

    const insight = parseGroqInsight(
      rawText,
      catalogProducts.map((p) => p.id),
    );

    const { data: insertedInsight, error: insertError } = await supabase
      .from("lead_synthetic_insights")
      .insert({
        lead_id: leadId,
        persona_summary: insight.persona_summary,
        preferences: insight.preferences,
        recommended_product_id: insight.recommended_product_id,
        recommended_product_reason: insight.recommended_product_reason,
        success_probability: insight.success_probability,
        score: insight.score,
        score_reason: insight.score_reason,
        metrics: insight.metrics,
        raw_response: groqData,
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (insertError || !insertedInsight) {
      return json({ error: insertError?.message ?? "No se pudo guardar el análisis" }, 500);
    }

    return json({ insight: insertedInsight });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error desconocido" }, 500);
  }
});
