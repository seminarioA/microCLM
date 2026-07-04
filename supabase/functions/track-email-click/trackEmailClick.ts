export const DEFAULT_FALLBACK = "https://microclm.vercel.app";

/**
 * Decide a dónde redirigir tras registrar el clic. Solo se confía en
 * destinos http(s) válidos; cualquier otro caso (nulo, malformado, u
 * otro esquema como `javascript:`) cae al fallback para evitar un
 * open redirect hacia esquemas no web.
 */
export function resolveRedirectTarget(target: string | null, fallback: string = DEFAULT_FALLBACK): string {
  if (!target) return fallback;

  try {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return target;
  } catch {
    return fallback;
  }
}
