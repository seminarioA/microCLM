export function mailtoLink(email: string): string {
  return `mailto:${email.trim()}`;
}

/** Convierte un teléfono en texto libre a un enlace de WhatsApp (wa.me solo acepta dígitos). */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
