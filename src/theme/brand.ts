/**
 * microCLM es un producto genérico; esto es la configuración del tenant
 * que lo está implementando (hoy: La Segunda Mordida). Cambiar de marca
 * es cambiar este archivo + tokens.css, no buscar strings/colores
 * repartidos por los componentes.
 */
export const brand = {
  productName: "microCLM",
  tenantName: "La Segunda Mordida",
  tenantShortName: "LSM",
};

export function brandLine(): string {
  return `${brand.productName} · ${brand.tenantName}`;
}

/** Lee el valor real de una variable CSS (--color-accent, etc.) para usarlo donde no se puede usar var(), como Chart.js. */
export function cssVar(name: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Paleta de acento (en el orden de la marca) para asignar colores a series/categorías dinámicas. */
export function accentPalette(): string[] {
  return [
    cssVar("--color-accent"),
    cssVar("--color-accent-deep"),
    cssVar("--color-terracotta"),
    cssVar("--color-amber"),
    cssVar("--color-moss"),
    cssVar("--color-moss-light"),
    cssVar("--color-legado"),
  ];
}

/** Asigna un color estable de la paleta a partir de una clave arbitraria (rubro, canal, etc). */
export function colorForKey(key: string, palette: string[] = accentPalette()): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] || palette[0];
}
