export function mailtoLink(email: string): string {
  return `mailto:${email.trim()}`;
}

/** Convierte un teléfono en texto libre a un enlace de WhatsApp (wa.me solo acepta dígitos). */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/** Asegura protocolo en una URL de LinkedIn guardada a mano sin "https://" (evita que el link navegue en relativo). */
export function linkedinLink(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
