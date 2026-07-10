import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  buildOsintProfile,
  buildSearchQuery,
  extractOgImage,
  extractVqd,
  parseDuckDuckGoHtml,
  parseImageSearchJson,
  photoSourceCandidates,
  type OsintProfile,
} from "./osintSearch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Intenta sacar una foto real de las redes/sitio encontrados (og:image). Best-effort: cualquier fallo se ignora. */
async function findPhotoFromSocialSources(profile: OsintProfile): Promise<string | null> {
  for (const url of photoSourceCandidates(profile)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": BROWSER_USER_AGENT } });
      if (!res.ok) continue;
      const html = await res.text();
      const image = extractOgImage(html);
      if (image) return image;
    } catch {
      // Sigue con la siguiente fuente.
    }
  }
  return null;
}

/** Respaldo: busca una imagen pública por nombre+empresa en la API de imágenes de DuckDuckGo. Best-effort. */
async function findPhotoFromImageSearch(query: string): Promise<string | null> {
  try {
    const landingRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    if (!landingRes.ok) return null;
    const vqd = extractVqd(await landingRes.text());
    if (!vqd) return null;

    const imagesRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`,
      { headers: { "User-Agent": BROWSER_USER_AGENT, Referer: "https://duckduckgo.com/" } },
    );
    if (!imagesRes.ok) return null;
    const images = parseImageSearchJson(await imagesRes.text());
    return images[0] ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, company } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return new Response(JSON.stringify({ error: "El nombre es obligatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = buildSearchQuery(name, company ?? "");
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `DuckDuckGo respondió ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await response.text();
    const results = parseDuckDuckGoHtml(html);
    const profile = buildOsintProfile(name, company ?? "", results);

    const socialPhoto = await findPhotoFromSocialSources(profile);
    const photoUrl = socialPhoto ?? (await findPhotoFromImageSearch(query)) ?? undefined;
    const photoSource = photoUrl ? (socialPhoto ? "social" : "search") : undefined;

    return new Response(JSON.stringify({ profile: { ...profile, photoUrl, photoSource } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
