import { describe, expect, it } from "vitest";
import { buildCatalogContext, buildLeadContext, parseGeminiInsight } from "./generateLeadInsight";

describe("buildLeadContext", () => {
  it("incluye los datos reales del lead", () => {
    const ctx = buildLeadContext({
      contactName: "Valeria Núñez",
      roleTitle: "Gerente de TI",
      companyName: "NorteTech",
      sectorLabel: "Software",
      stageLabel: "Cierre exitoso",
      dealValue: 5000,
      timelineSummaries: ["Llamada: seguimiento inicial"],
    });
    expect(ctx).toContain("Valeria Núñez");
    expect(ctx).toContain("Gerente de TI");
    expect(ctx).toContain("NorteTech");
    expect(ctx).toContain("Software");
    expect(ctx).toContain("5000");
    expect(ctx).toContain("Llamada: seguimiento inicial");
  });

  it("indica cuando no hay historial de interacciones", () => {
    const ctx = buildLeadContext({
      contactName: "Nuevo Lead",
      roleTitle: null,
      companyName: "ACME",
      sectorLabel: "Retail",
      stageLabel: "Lead captado",
      dealValue: null,
      timelineSummaries: [],
    });
    expect(ctx).toContain("sin registros aún");
    expect(ctx).toContain("no registrado");
  });
});

describe("buildCatalogContext", () => {
  it("lista los productos con su id real", () => {
    const ctx = buildCatalogContext([
      { id: "p1", name: "Plan Pro", description: "Soporte prioritario", category: "Software", price: 199 },
    ]);
    expect(ctx).toContain("p1");
    expect(ctx).toContain("Plan Pro");
    expect(ctx).toContain("Soporte prioritario");
  });

  it("avisa cuando no hay catálogo", () => {
    expect(buildCatalogContext([])).toContain("no hay productos");
  });
});

describe("parseGeminiInsight", () => {
  const validIds = ["p1", "p2"];

  it("parsea una respuesta bien formada", () => {
    const raw = JSON.stringify({
      persona_summary: "Le interesa la automatización.",
      preferences: ["automatización", "soporte 24/7"],
      recommended_product_id: "p1",
      recommended_product_reason: "Encaja con su necesidad de soporte.",
      success_probability: 0.72,
      score: 81,
      metrics: { engagement: 70, sector_fit: 90, budget_fit: 60, urgency: 55 },
    });
    const result = parseGeminiInsight(raw, validIds);
    expect(result.persona_summary).toBe("Le interesa la automatización.");
    expect(result.preferences).toEqual(["automatización", "soporte 24/7"]);
    expect(result.recommended_product_id).toBe("p1");
    expect(result.success_probability).toBe(0.72);
    expect(result.score).toBe(81);
    expect(result.metrics.sector_fit).toBe(90);
  });

  it("descarta un recommended_product_id que no existe en el catálogo real", () => {
    const raw = JSON.stringify({
      persona_summary: "x",
      preferences: [],
      recommended_product_id: "producto-inventado",
      recommended_product_reason: "x",
      success_probability: 0.5,
      score: 50,
      metrics: { engagement: 1, sector_fit: 1, budget_fit: 1, urgency: 1 },
    });
    expect(parseGeminiInsight(raw, validIds).recommended_product_id).toBeNull();
  });

  it("recorta success_probability y score fuera de rango", () => {
    const raw = JSON.stringify({
      persona_summary: "x",
      preferences: [],
      recommended_product_id: null,
      recommended_product_reason: null,
      success_probability: 5,
      score: 500,
      metrics: { engagement: -10, sector_fit: 200, budget_fit: 1, urgency: 1 },
    });
    const result = parseGeminiInsight(raw, validIds);
    expect(result.success_probability).toBe(1);
    expect(result.score).toBe(100);
    expect(result.metrics.engagement).toBe(0);
    expect(result.metrics.sector_fit).toBe(100);
  });

  it("lanza un error si la respuesta no es JSON", () => {
    expect(() => parseGeminiInsight("no soy json", validIds)).toThrow(/JSON válido/);
  });

  it("lanza un error si la respuesta no es un objeto", () => {
    expect(() => parseGeminiInsight("42", validIds)).toThrow(/forma inesperada/);
  });
});
