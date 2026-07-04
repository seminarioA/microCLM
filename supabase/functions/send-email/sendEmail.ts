export const FROM_EMAIL = "microCLM <onboarding@resend.dev>";

export interface EmailInput {
  to: unknown;
  subject: unknown;
  bodyHtml: unknown;
}

/** Valida el payload de entrada. Devuelve el mensaje de error, o null si es válido. */
export function validateEmailInput({ to, subject, bodyHtml }: EmailInput): string | null {
  if (!to || typeof to !== "string" || !subject || !bodyHtml) {
    return "to, subject y bodyHtml son obligatorios";
  }
  return null;
}

/** Inserta el pixel de apertura y reescribe los links para trackear clics. */
export function instrumentHtml(html: string, emailId: string, functionsBaseUrl: string): string {
  const withTrackedLinks = html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi, (_match, before, href, after) => {
    const trackedHref = `${functionsBaseUrl}/track-email-click?id=${emailId}&url=${encodeURIComponent(href)}`;
    return `<a ${before}href="${trackedHref}"${after}>`;
  });

  const pixel = `<img src="${functionsBaseUrl}/track-email-open?id=${emailId}" width="1" height="1" alt="" style="display:none" />`;
  return `${withTrackedLinks}${pixel}`;
}
