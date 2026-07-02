export type Confidence = "Alta" | "Media" | "Baja";

export interface OsintSignal {
  label: string;
  value: string;
  confidence: Confidence;
}

export interface OsintMention {
  title: string;
  source: string;
  date: string;
}

export interface OsintProfile {
  name: string;
  role: string;
  company: string;
  location: string;
  sector: string;
  digitalFootprint: OsintSignal[];
  companyInfo: OsintSignal[];
  mentions: OsintMention[];
  contact: OsintSignal[];
}

const ROLES = [
  "Gerente Comercial",
  "Fundador & CEO",
  "Directora de Operaciones",
  "Jefe de Compras",
  "VP de Tecnología",
  "Gerente de Marketing",
  "Directora Financiera",
];

const LOCATIONS = [
  "Lima, Perú",
  "Arequipa, Perú",
  "Trujillo, Perú",
  "Bogotá, Colombia",
  "Santiago, Chile",
  "Ciudad de México, México",
];

const SECTORS = ["Software", "Minería", "Retail", "Finanzas", "Construcción", "Salud", "Educación"];

const COMPANY_SUFFIX = ["Perú", "Group", "Solutions", "Corp", "Andina", "Global"];

const COMPANY_SIZES = ["1-10 empleados", "11-50 empleados", "51-200 empleados", "201-500 empleados"];

const MENTION_TEMPLATES: { title: string; source: string }[] = [
  { title: "{company} anuncia una ronda de expansión regional", source: "Diario Gestión" },
  { title: "Entrevista a {name}: el futuro del sector {sector}", source: "Podcast La Segunda Mordida" },
  { title: "{company} entre las empresas más innovadoras del año", source: "PulsoNegocios" },
  { title: "{name} participó como panelista en el Foro Andino de Negocios", source: "LinkedIn (publicación pública)" },
  { title: "{company} abre nueva sede y busca talento", source: "Portal de empleo" },
];

const MENTION_AGES = ["hace 2 semanas", "hace 1 mes", "hace 3 meses", "hace 6 meses"];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length];
}

/**
 * Genera un perfil de prospección simulado a partir de fuentes públicas.
 * No consulta servicios externos ni datos reales: es una demo de cómo
 * luciría un módulo de enriquecimiento OSINT dentro del CRM.
 */
export function generateOsintProfile(rawName: string, rawCompany: string): OsintProfile {
  const name = rawName.trim();
  const seed = hashSeed(name.toLowerCase() + rawCompany.toLowerCase());
  const role = pick(ROLES, seed, 1);
  const location = pick(LOCATIONS, seed, 2);
  const sector = pick(SECTORS, seed, 3);
  const firstName = name.split(" ")[0] || "contacto";
  const company = rawCompany.trim() || `${firstName} ${pick(COMPANY_SUFFIX, seed, 4)}`;
  const handle = name.toLowerCase().replace(/\s+/g, "");
  const domain = company.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".pe";

  const hasX = seed % 3 === 0;
  const hasInstagram = seed % 2 === 0;

  const digitalFootprint: OsintSignal[] = [
    { label: "LinkedIn", value: `linkedin.com/in/${handle}`, confidence: "Alta" },
    { label: "Sitio corporativo", value: `www.${domain}`, confidence: "Alta" },
    {
      label: "X (Twitter)",
      value: hasX ? `@${handle}` : "Sin actividad pública reciente",
      confidence: hasX ? "Media" : "Baja",
    },
    {
      label: "Instagram",
      value: hasInstagram ? `@${handle}.oficial` : "No encontrado en fuentes abiertas",
      confidence: hasInstagram ? "Media" : "Baja",
    },
  ];

  const companyInfo: OsintSignal[] = [
    { label: "Sector", value: sector, confidence: "Alta" },
    { label: "Tamaño estimado", value: pick(COMPANY_SIZES, seed, 5), confidence: "Media" },
    { label: "Sede principal", value: location, confidence: "Media" },
  ];

  const mentions: OsintMention[] = MENTION_TEMPLATES.filter((_, i) => (seed + i) % 2 === 0 || i < 2)
    .slice(0, 3)
    .map((tpl, i) => ({
      title: tpl.title.replace("{company}", company).replace("{name}", name).replace("{sector}", sector),
      source: tpl.source,
      date: pick(MENTION_AGES, seed, i + 10),
    }));

  const contact: OsintSignal[] = [
    { label: "Patrón de correo estimado", value: `${firstName.toLowerCase()}@${domain}`, confidence: "Media" },
    { label: "Teléfono público", value: "No disponible en fuentes abiertas", confidence: "Baja" },
  ];

  return { name, role, company, location, sector, digitalFootprint, companyInfo, mentions, contact };
}

export const OSINT_LOADING_TEXTS = [
  "Rastreando presencia en LinkedIn...",
  "Revisando el sitio corporativo...",
  "Buscando menciones en prensa y podcasts...",
  "Verificando redes sociales públicas...",
  "Consolidando perfil de prospección...",
];
