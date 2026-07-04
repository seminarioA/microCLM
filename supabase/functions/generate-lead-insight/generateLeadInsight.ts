export const GEMINI_MODEL = "gemini-2.0-flash";

export interface LeadContextInput {
  contactName: string;
  roleTitle: string | null;
  companyName: string;
  sectorLabel: string;
  stageLabel: string;
  dealValue: number | null;
  timelineSummaries: string[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
}

/** Arma el bloque de contexto real del lead que se manda como parte del prompt a Gemini. */
export function buildLeadContext(input: LeadContextInput): string {
  const lines = [
    `Contacto: ${input.contactName}${input.roleTitle ? ` (${input.roleTitle})` : ""}`,
    `Empresa: ${input.companyName}`,
    `Rubro: ${input.sectorLabel}`,
    `Etapa en el pipeline: ${input.stageLabel}`,
    `Valor estimado del trato: ${input.dealValue != null ? input.dealValue : "no registrado"}`,
    input.timelineSummaries.length > 0
      ? `Historial de interacciones (más reciente primero):\n${input.timelineSummaries.map((t) => `- ${t}`).join("\n")}`
      : "Historial de interacciones: sin registros aún.",
  ];
  return lines.join("\n");
}

/** Arma el bloque del catálogo disponible para que Gemini elija un producto/servicio real, nunca inventado. */
export function buildCatalogContext(products: CatalogProduct[]): string {
  if (products.length === 0) return "Catálogo: no hay productos/servicios activos registrados.";
  return `Catálogo disponible (elige el id exacto de uno de estos, o null si ninguno aplica):\n${products
    .map((p) => `- id: ${p.id} | ${p.name}${p.category ? ` (${p.category})` : ""}${p.price != null ? ` — S/ ${p.price}` : ""}: ${p.description ?? "sin descripción"}`)
    .join("\n")}`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    persona_summary: { type: "string" },
    preferences: { type: "array", items: { type: "string" } },
    recommended_product_id: { type: "string", nullable: true },
    recommended_product_reason: { type: "string" },
    success_probability: { type: "number" },
    score: { type: "number" },
    metrics: {
      type: "object",
      properties: {
        engagement: { type: "number" },
        sector_fit: { type: "number" },
        budget_fit: { type: "number" },
        urgency: { type: "number" },
      },
      required: ["engagement", "sector_fit", "budget_fit", "urgency"],
    },
  },
  required: [
    "persona_summary",
    "preferences",
    "recommended_product_reason",
    "success_probability",
    "score",
    "metrics",
  ],
};

/** Arma el body completo para POST a la API de Gemini (generateContent), con salida JSON forzada por schema. */
export function buildGeminiRequestBody(leadContext: string, catalogContext: string) {
  const prompt = [
    "Eres un analista de ventas B2B. Con la información real de este lead y el catálogo real de la empresa, genera un análisis de lead sintético.",
    "No inventes datos que no estén en el contexto. Si recomiendas un producto, su id debe ser exactamente uno de los ids listados en el catálogo (o null si ninguno encaja).",
    "",
    leadContext,
    "",
    catalogContext,
    "",
    "Devuelve: persona_summary (2-3 oraciones sobre gustos/preferencias inferidos), preferences (lista corta de intereses/preferencias concretas), recommended_product_id, recommended_product_reason, success_probability (0 a 1, probabilidad de cerrar la venta), score (0 a 100, puntuación general de la oportunidad), y metrics con engagement/sector_fit/budget_fit/urgency (cada una 0 a 100).",
  ].join("\n");

  return {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
}

export interface ParsedInsight {
  persona_summary: string;
  preferences: string[];
  recommended_product_id: string | null;
  recommended_product_reason: string | null;
  success_probability: number;
  score: number;
  metrics: {
    engagement: number;
    sector_fit: number;
    budget_fit: number;
    urgency: number;
  };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Parsea y sanea el JSON que devuelve Gemini. Nunca confía ciegamente en el
 * modelo: recorta probabilidades/scores fuera de rango y descarta un
 * `recommended_product_id` que no exista en el catálogo real (evita que la
 * IA "alucine" un producto que no existe).
 */
export function parseGeminiInsight(rawText: string, validProductIds: string[]): ParsedInsight {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini devolvió una respuesta que no es JSON válido");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Gemini devolvió una respuesta con forma inesperada");
  }

  const p = parsed as Record<string, unknown>;
  const metricsRaw = (typeof p.metrics === "object" && p.metrics !== null ? p.metrics : {}) as Record<string, unknown>;

  const recommendedId = typeof p.recommended_product_id === "string" ? p.recommended_product_id : null;

  return {
    persona_summary: typeof p.persona_summary === "string" ? p.persona_summary : "Sin análisis disponible.",
    preferences: Array.isArray(p.preferences) ? p.preferences.filter((x): x is string => typeof x === "string") : [],
    recommended_product_id: recommendedId && validProductIds.includes(recommendedId) ? recommendedId : null,
    recommended_product_reason: typeof p.recommended_product_reason === "string" ? p.recommended_product_reason : null,
    success_probability: clamp(p.success_probability, 0, 1, 0),
    score: clamp(p.score, 0, 100, 0),
    metrics: {
      engagement: clamp(metricsRaw.engagement, 0, 100, 0),
      sector_fit: clamp(metricsRaw.sector_fit, 0, 100, 0),
      budget_fit: clamp(metricsRaw.budget_fit, 0, 100, 0),
      urgency: clamp(metricsRaw.urgency, 0, 100, 0),
    },
  };
}
