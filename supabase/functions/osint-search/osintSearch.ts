/**
 * Lógica pura de prospección OSINT sobre resultados de búsqueda de DuckDuckGo.
 *
 * Sin dependencias de Deno ni del navegador: se puede probar con Vitest y
 * también se ejecuta tal cual dentro de la Edge Function de Supabase.
 */

export interface DuckDuckGoResult {
  title: string;
  url: string;
  snippet: string;
}

export type Confidence = "Alta" | "Media" | "Baja";

export interface OsintSignal {
  label: string;
  value: string;
  confidence: Confidence;
}

export interface OsintMention {
  title: string;
  source: string;
  url: string;
}

export type PhotoSource = "social" | "search";

export interface PhotoCandidate {
  url: string;
  /** "social": la foto viene de una red/sitio ya vinculado a esta persona. "search": es una búsqueda de imagen genérica, sin confirmar que sea la persona correcta. */
  source: PhotoSource;
}

export interface OsintProfile {
  name: string;
  company: string;
  digitalFootprint: OsintSignal[];
  companyInfo: OsintSignal[];
  mentions: OsintMention[];
  contact: OsintSignal[];
  resultCount: number;
  /** @deprecated usar photoCandidates[0]; se mantiene por compatibilidad. */
  photoUrl?: string;
  /** @deprecated usar photoCandidates[0].source; se mantiene por compatibilidad. */
  photoSource?: PhotoSource;
  photoCandidates?: PhotoCandidate[];
}

export function buildSearchQuery(name: string, company: string): string {
  const parts = [name.trim()];
  if (company.trim()) parts.push(company.trim());
  return parts.join(" ");
}

const NAMED_ENTITIES: Record<string, string> = {
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  iexcl: "¡",
  iquest: "¿",
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (full, name) => NAMED_ENTITIES[name] ?? full)
    .trim();
}

function extractRealUrl(href: string): string {
  const uddgMatch = href.match(/uddg=([^&]+)/);
  if (uddgMatch) {
    try {
      return decodeURIComponent(uddgMatch[1]);
    } catch {
      return href;
    }
  }
  return href.startsWith("//") ? `https:${href}` : href;
}

/** Extrae título, URL y snippet de una página de resultados HTML de DuckDuckGo. */
export function parseDuckDuckGoHtml(html: string): DuckDuckGoResult[] {
  const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRegex = /<a[^>]*class="result__snippet"[^>]*href="[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

  const titles: { url: string; title: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = titleRegex.exec(html))) {
    titles.push({ url: extractRealUrl(match[1]), title: decodeHtmlEntities(match[2]) });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html))) {
    snippets.push(decodeHtmlEntities(match[1]));
  }

  return titles
    .filter((t) => t.title.length > 0 && t.url.length > 0)
    .map((t, i) => ({ title: t.title, url: t.url, snippet: snippets[i] ?? "" }));
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function firstName(fullName: string): string {
  return (fullName.trim().split(/\s+/)[0] || "contacto").toLowerCase();
}

/** Clasifica resultados de búsqueda reales en señales de prospección OSINT. */
export function buildOsintProfile(name: string, company: string, results: DuckDuckGoResult[]): OsintProfile {
  const companySlug = slugify(company);

  const linkedin = results.find((r) => /linkedin\.com\/in\//i.test(r.url));
  const twitter = results.find((r) => /(twitter\.com|x\.com)\//i.test(r.url));
  const instagram = results.find((r) => /instagram\.com\//i.test(r.url));
  const companySite = results.find((r) => {
    const host = safeHostname(r.url);
    if (!host) return false;
    if (/linkedin\.com|twitter\.com|x\.com|instagram\.com|facebook\.com/i.test(host)) return false;
    return companySlug.length > 0 && host.replace(/\./g, "").includes(companySlug);
  });

  const digitalFootprint: OsintSignal[] = [
    {
      label: "LinkedIn",
      value: linkedin ? linkedin.url : "No encontrado en la búsqueda",
      confidence: linkedin ? "Alta" : "Baja",
    },
    {
      label: "Sitio corporativo",
      value: companySite ? companySite.url : "No encontrado en la búsqueda",
      confidence: companySite ? "Media" : "Baja",
    },
    {
      label: "X (Twitter)",
      value: twitter ? twitter.url : "No encontrado en la búsqueda",
      confidence: twitter ? "Media" : "Baja",
    },
    {
      label: "Instagram",
      value: instagram ? instagram.url : "No encontrado en la búsqueda",
      confidence: instagram ? "Media" : "Baja",
    },
  ];

  const featured = new Set([linkedin?.url, twitter?.url, instagram?.url, companySite?.url].filter(Boolean));
  const mentions: OsintMention[] = results
    .filter((r) => !featured.has(r.url))
    .slice(0, 5)
    .map((r) => ({ title: r.title, source: safeHostname(r.url) ?? r.url, url: r.url }));

  const domain = companySite ? safeHostname(companySite.url) : null;
  const contact: OsintSignal[] = [
    {
      label: "Patrón de correo estimado",
      value: domain ? `${firstName(name)}@${domain}` : "No se pudo estimar (sin sitio corporativo detectado)",
      confidence: domain ? "Media" : "Baja",
    },
  ];

  const companyInfo: OsintSignal[] = [
    {
      label: "Sitio detectado",
      value: companySite?.url ?? "No encontrado en la búsqueda",
      confidence: companySite ? "Alta" : "Baja",
    },
  ];

  return { name, company, digitalFootprint, companyInfo, mentions, contact, resultCount: results.length };
}

/** URLs encontradas (en orden de prioridad) de donde intentar sacar una foto real vía og:image. */
export function photoSourceCandidates(profile: OsintProfile): string[] {
  const byLabel = (label: string) => profile.digitalFootprint.find((s) => s.label === label);
  return [byLabel("LinkedIn"), byLabel("Instagram"), byLabel("X (Twitter)"), byLabel("Sitio corporativo")]
    .filter((s): s is OsintSignal => !!s && s.confidence !== "Baja" && /^https?:\/\//.test(s.value))
    .map((s) => s.value);
}

/** Combina fotos de fuentes sociales (confirmadas) y de búsqueda genérica (sin confirmar) en una sola lista, sin duplicados, hasta `max`. */
export function buildPhotoCandidates(socialImages: string[], searchImages: string[], max = 4): PhotoCandidate[] {
  const seen = new Set<string>();
  const candidates: PhotoCandidate[] = [];

  for (const url of socialImages) {
    if (candidates.length >= max || seen.has(url)) continue;
    seen.add(url);
    candidates.push({ url, source: "social" });
  }
  for (const url of searchImages) {
    if (candidates.length >= max || seen.has(url)) continue;
    seen.add(url);
    candidates.push({ url, source: "search" });
  }

  return candidates;
}

/** Extrae la URL de la meta tag og:image (o twitter:image como respaldo) de una página HTML. */
export function extractOgImage(html: string): string | null {
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) return decodeHtmlEntities(ogMatch[1]);

  const twitterMatch =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  return twitterMatch ? decodeHtmlEntities(twitterMatch[1]) : null;
}

/** Extrae el token "vqd" que exige la API interna de búsqueda de imágenes de DuckDuckGo. */
export function extractVqd(html: string): string | null {
  const match = html.match(/vqd=['"]([\d-]+)['"]/) ?? html.match(/vqd=([\d-]+)&/);
  return match ? match[1] : null;
}

/** Extrae las URLs de imagen de la respuesta JSON de la API de imágenes de DuckDuckGo (i.js). */
export function parseImageSearchJson(json: string): string[] {
  try {
    const data = JSON.parse(json) as { results?: { image?: string }[] };
    return (data.results ?? []).map((r) => r.image).filter((url): url is string => !!url && /^https?:\/\//.test(url));
  } catch {
    return [];
  }
}
