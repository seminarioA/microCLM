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

export interface TenantColorOverrides {
  color_accent: string;
  color_accent_deep: string;
  color_moss: string;
  color_moss_light: string;
  color_amber: string;
  color_terracotta: string;
  color_legado: string;
}

/** Sobrescribe en caliente las variables CSS de marca (tokens.css sigue siendo el default de fábrica). */
export function applyTenantColors(colors: TenantColorOverrides): void {
  const root = document.documentElement.style;
  root.setProperty("--color-accent", colors.color_accent);
  root.setProperty("--color-accent-deep", colors.color_accent_deep);
  root.setProperty("--color-moss", colors.color_moss);
  root.setProperty("--color-moss-light", colors.color_moss_light);
  root.setProperty("--color-amber", colors.color_amber);
  root.setProperty("--color-terracotta", colors.color_terracotta);
  root.setProperty("--color-legado", colors.color_legado);
}
