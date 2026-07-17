import { describe, expect, it } from "vitest";

/**
 * Test de integración real: llama a la Edge Function ya desplegada en
 * Supabase, que a su vez consulta DuckDuckGo. La request a DuckDuckGo
 * sale desde la red de Supabase, no desde el runner de GitHub Actions,
 * así que no depende de la IP compartida del runner para evitar bloqueos.
 *
 * Se salta automáticamente si no hay credenciales de Supabase en el
 * entorno (por ejemplo, en un checkout local sin las variables
 * configuradas) para no romper `npm run test` fuera de CI.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const hasCredentials = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

describe.skipIf(!hasCredentials)("osint-search Edge Function (integración real)", () => {
  it(
    "devuelve un perfil con la forma esperada para una búsqueda pública real",
    async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/osint-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ name: "Satya Nadella", company: "Microsoft" }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.profile).toBeDefined();
      expect(data.profile.name).toBe("Satya Nadella");
      expect(data.profile.company).toBe("Microsoft");
      expect(typeof data.profile.resultCount).toBe("number");
      expect(data.profile.resultCount).toBeGreaterThan(0);

      expect(data.profile.digitalFootprint).toHaveLength(4);
      for (const signal of data.profile.digitalFootprint) {
        expect(signal).toHaveProperty("label");
        expect(signal).toHaveProperty("value");
        expect(["Alta", "Media", "Baja"]).toContain(signal.confidence);
      }

      expect(Array.isArray(data.profile.mentions)).toBe(true);
      expect(Array.isArray(data.profile.contact)).toBe(true);

      // La foto es best-effort (puede no encontrarse), pero si viene, debe tener la forma correcta.
      if (data.profile.photoUrl) {
        expect(typeof data.profile.photoUrl).toBe("string");
        expect(["social", "search"]).toContain(data.profile.photoSource);
      }
      expect(Array.isArray(data.profile.photoCandidates)).toBe(true);
      expect(data.profile.photoCandidates.length).toBeLessThanOrEqual(4);
      for (const candidate of data.profile.photoCandidates) {
        expect(typeof candidate.url).toBe("string");
        expect(["social", "search"]).toContain(candidate.source);
      }
    },
    20000,
  );

  it("responde 400 cuando falta el nombre", async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/osint-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ name: "", company: "MegaCorp" }),
    });

    expect(response.status).toBe(400);
  });
});
