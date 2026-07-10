import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

export type PipelineStage = Database["public"]["Tables"]["pipeline_stages"]["Row"];

export interface LeadRecord {
  id: string;
  sector: string | null;
  closed: boolean;
  lost: boolean;
  created_at: string;
  stage_id: string;
  source: string | null;
  value: number | null;
  contact: { id: string; full_name: string; avatar_url: string | null } | null;
  company: { id: string; name: string } | null;
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

export async function fetchStages(): Promise<PipelineStage[]> {
  const { data, error } = await supabase.from("pipeline_stages").select("*").order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeads(): Promise<LeadRecord[]> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, sector, closed, lost, created_at, stage_id, source, value, contact:contacts(id, full_name, avatar_url), company:companies(id, name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    contact: one(row.contact as unknown as LeadRecord["contact"] | LeadRecord["contact"][]),
    company: one(row.company as unknown as LeadRecord["company"] | LeadRecord["company"][]),
  }));
}

export async function updateLeadStage(leadId: string, stageId: string) {
  const { error } = await supabase
    .from("leads")
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
}

export function daysSince(isoDate: string): number {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export interface NewLeadInput {
  name: string;
  email: string;
  company: string;
  sector: string;
  /** Si el usuario eligió una empresa existente de las sugerencias, su id exacto (evita duplicar por variantes de escritura como "UTP" / "Universidad Tecnológica del Perú"). */
  companyId?: string;
}

export interface CreatedLead {
  leadId: string;
  contactId: string;
  companyId: string;
  code: string;
}

export interface CompanySuggestion {
  id: string;
  name: string;
}

/** Sugiere empresas ya existentes que coinciden con lo escrito, para que el usuario vincule siempre a la misma entidad. */
export async function searchCompanies(query: string): Promise<CompanySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.from("companies").select("id, name").ilike("name", `%${q}%`).limit(6);
  if (error) throw error;
  return data ?? [];
}

/**
 * Resuelve texto libre de empresa a una entidad ya existente, sin depender de
 * que el usuario haga click en una sugerencia: si hay coincidencia exacta
 * (sin importar mayúsculas) se usa esa; si no, la primera coincidencia
 * parcial. Devuelve null si la empresa no existe todavía (se creará nueva).
 */
export async function resolveCompany(query: string): Promise<CompanySuggestion | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const matches = await searchCompanies(trimmed);
  if (matches.length === 0) return null;
  const exact = matches.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
  return exact ?? matches[0];
}

/** Crea (o reutiliza) la empresa, el contacto y el lead en la etapa "Lead captado". */
export async function createLeadFromForm(input: NewLeadInput): Promise<CreatedLead> {
  let companyId = input.companyId;
  if (!companyId) {
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", input.company.trim())
      .maybeSingle();
    companyId = existingCompany?.id;
  }

  if (!companyId) {
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({ name: input.company.trim(), sector: input.sector })
      .select("id")
      .single();
    if (companyError) throw companyError;
    companyId = newCompany.id;
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({ full_name: input.name.trim(), email: input.email.trim(), company_id: companyId })
    .select("id")
    .single();
  if (contactError) throw contactError;

  const { data: stage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("key", "lead-captado")
    .single();
  if (stageError) throw stageError;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      contact_id: contact.id,
      company_id: companyId,
      stage_id: stage.id,
      sector: input.sector,
      source: "Formulario web",
    })
    .select("id, created_at")
    .single();
  if (leadError) throw leadError;

  const year = new Date(lead.created_at).getFullYear();
  const code = `LEAD-${year}-${lead.id.slice(0, 4).toUpperCase()}`;

  return { leadId: lead.id, contactId: contact.id, companyId, code };
}

export interface OsintLeadInput {
  name: string;
  sector: string;
  company?: string;
  companyId?: string;
  email?: string;
  linkedinUrl?: string;
}

/** Convierte un perfil de Prospección OSINT en un lead real, en la etapa "Lead captado". */
export async function createLeadFromOsint(input: OsintLeadInput): Promise<CreatedLead> {
  const company = input.company?.trim();
  let companyId = input.companyId;
  if (!companyId && company) {
    companyId = (await resolveCompany(company))?.id;
  }
  if (!companyId && company) {
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({ name: company, sector: input.sector })
      .select("id")
      .single();
    if (companyError) throw companyError;
    companyId = newCompany.id;
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      full_name: input.name.trim(),
      email: input.email?.trim() || null,
      linkedin_url: input.linkedinUrl?.trim() || null,
      company_id: companyId ?? null,
    })
    .select("id")
    .single();
  if (contactError) throw contactError;

  const { data: stage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("key", "lead-captado")
    .single();
  if (stageError) throw stageError;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      contact_id: contact.id,
      company_id: companyId ?? null,
      stage_id: stage.id,
      sector: input.sector,
      source: "Prospección OSINT",
    })
    .select("id, created_at")
    .single();
  if (leadError) throw leadError;

  const year = new Date(lead.created_at).getFullYear();
  const code = `LEAD-${year}-${lead.id.slice(0, 4).toUpperCase()}`;

  return { leadId: lead.id, contactId: contact.id, companyId: companyId ?? "", code };
}

export interface AnalyticsLead {
  id: string;
  stage_id: string;
  sector: string | null;
  source: string | null;
  closed: boolean;
  lost: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchLeadsForAnalytics(): Promise<AnalyticsLead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, stage_id, sector, source, closed, lost, created_at, updated_at");
  if (error) throw error;
  return data ?? [];
}

export function averageCloseDays(leads: AnalyticsLead[]): number {
  const closedLeads = leads.filter((l) => l.closed);
  if (closedLeads.length === 0) return 0;
  const totalDays = closedLeads.reduce((sum, l) => {
    const created = new Date(l.created_at).getTime();
    const updated = new Date(l.updated_at).getTime();
    return sum + Math.max(0, (updated - created) / (1000 * 60 * 60 * 24));
  }, 0);
  return Math.round(totalDays / closedLeads.length);
}

export function countBy(leads: AnalyticsLead[], key: "sector" | "source"): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    const value = lead[key];
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

export interface LeadProfile {
  leadId: string;
  contactId: string;
  companyId: string | null;
  stageLabel: string;
  sector: string | null;
  contact: {
    full_name: string;
    email: string | null;
    phone: string | null;
    role_title: string | null;
    linkedin_url: string | null;
    avatar_url: string | null;
  };
  company: { name: string };
}

export type TimelineEvent = Database["public"]["Tables"]["timeline_events"]["Row"];

/**
 * Carga el perfil de un lead. Sin `leadId`, elige el lead con historial de
 * interacciones más antiguo (o el más reciente si aún no hay timeline).
 */
export async function fetchLeadProfile(leadId?: string): Promise<LeadProfile | null> {
  let id = leadId;

  if (!id) {
    const { data: firstEvent } = await supabase
      .from("timeline_events")
      .select("lead_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    id = firstEvent?.lead_id;
  }

  if (!id) {
    const { data: latestLead } = await supabase
      .from("leads")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    id = latestLead?.id;
  }

  if (!id) return null;

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, contact_id, company_id, sector, stage:pipeline_stages(label), contact:contacts(full_name, email, phone, role_title, linkedin_url, avatar_url), company:companies(name)",
    )
    .eq("id", id)
    .single();
  if (error) throw error;

  const stage = one(data.stage as unknown as { label: string } | { label: string }[]);
  const contact = one(data.contact as unknown as LeadProfile["contact"] | LeadProfile["contact"][]);
  const company = one(data.company as unknown as LeadProfile["company"] | LeadProfile["company"][]);

  return {
    leadId: data.id,
    contactId: data.contact_id ?? "",
    companyId: data.company_id,
    stageLabel: stage?.label ?? "Sin etapa",
    sector: data.sector,
    contact: contact ?? {
      full_name: "Sin nombre",
      email: null,
      phone: null,
      role_title: null,
      linkedin_url: null,
      avatar_url: null,
    },
    company: company ?? { name: "Sin empresa" },
  };
}

export interface ContactUpdateInput {
  full_name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  linkedin_url: string | null;
}

export async function updateContact(contactId: string, input: ContactUpdateInput) {
  const { error } = await supabase.from("contacts").update(input).eq("id", contactId);
  if (error) throw error;
}

export async function updateCompanyName(companyId: string, name: string) {
  const { error } = await supabase.from("companies").update({ name: name.trim() }).eq("id", companyId);
  if (error) throw error;
}

export interface LeadSearchResult {
  leadId: string;
  contactName: string;
  companyName: string;
}

/** Busca leads por nombre de contacto o de empresa. */
export async function searchLeads(query: string): Promise<LeadSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [{ data: contactMatches }, { data: companyMatches }] = await Promise.all([
    supabase.from("contacts").select("id").ilike("full_name", `%${q}%`).limit(5),
    supabase.from("companies").select("id").ilike("name", `%${q}%`).limit(5),
  ]);

  const contactIds = (contactMatches ?? []).map((c) => c.id);
  const companyIds = (companyMatches ?? []).map((c) => c.id);
  if (contactIds.length === 0 && companyIds.length === 0) return [];

  const orParts: string[] = [];
  if (contactIds.length) orParts.push(`contact_id.in.(${contactIds.join(",")})`);
  if (companyIds.length) orParts.push(`company_id.in.(${companyIds.join(",")})`);

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, contact:contacts(full_name), company:companies(name)")
    .or(orParts.join(","))
    .limit(8);
  if (error) throw error;

  return (leads ?? []).map((l) => ({
    leadId: l.id,
    contactName: one(l.contact as unknown as { full_name: string } | { full_name: string }[])?.full_name ?? "Sin nombre",
    companyName: one(l.company as unknown as { name: string } | { name: string }[])?.name ?? "Sin empresa",
  }));
}

export async function fetchTimeline(leadId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addTimelineEvent(leadId: string, type: string, title: string, description: string) {
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({ lead_id: leadId, type, title, description })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export interface NewNotificationInput {
  title: string;
  message: string;
  icon: "clock" | "alert" | "arrow";
  leadId?: string;
}

/** Crea una notificación real disparada por un evento del CRM (nuevo lead, cambio de etapa, etc). */
export async function createNotification(input: NewNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    title: input.title,
    message: input.message,
    icon: input.icon,
    lead_id: input.leadId ?? null,
  });
  if (error) throw error;
}

/** Sugiere nombres de contactos ya existentes que coinciden con lo escrito. */
export async function searchContactNames(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("contacts")
    .select("full_name")
    .ilike("full_name", `%${q}%`)
    .limit(6);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((c) => c.full_name)));
}

export async function updateProfile(userId: string, input: { full_name: string; role_title: string }) {
  const { error } = await supabase.from("profiles").update(input).eq("id", userId);
  if (error) throw error;
}

/** Sube la foto de perfil al bucket "avatars" y actualiza profiles.avatar_url. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
  if (updateError) throw updateError;

  return publicUrl;
}

/** Sube manualmente la foto de un contacto (perfil de "Perfiles") al bucket "avatars". */
export async function uploadContactAvatar(contactId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `contacts/${contactId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase.from("contacts").update({ avatar_url: publicUrl }).eq("id", contactId);
  if (updateError) throw updateError;

  return publicUrl;
}

export interface OsintSignal {
  label: string;
  value: string;
  confidence: "Alta" | "Media" | "Baja";
}

export interface OsintMention {
  title: string;
  source: string;
  url: string;
}

export interface OsintSearchProfile {
  name: string;
  company: string;
  digitalFootprint: OsintSignal[];
  companyInfo: OsintSignal[];
  mentions: OsintMention[];
  contact: OsintSignal[];
  resultCount: number;
  photoUrl?: string;
  photoSource?: "social" | "search";
}

/** Ejecuta la búsqueda OSINT real (Edge Function -> DuckDuckGo) para un nombre/empresa. */
export async function runOsintSearch(name: string, company: string): Promise<OsintSearchProfile> {
  const { data, error } = await supabase.functions.invoke("osint-search", { body: { name, company } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.profile as OsintSearchProfile;
}

export type Sector = Database["public"]["Tables"]["sectors"]["Row"];

export async function fetchSectors(): Promise<Sector[]> {
  const { data, error } = await supabase.from("sectors").select("*").order("label");
  if (error) throw error;
  return data ?? [];
}

function slugifySectorKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Crea un nuevo rubro si no existe uno con el mismo nombre. */
export async function createSector(label: string): Promise<Sector> {
  const key = slugifySectorKey(label);
  const { data: existing } = await supabase.from("sectors").select("*").eq("key", key).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase.from("sectors").insert({ key, label: label.trim() }).select("*").single();
  if (error) throw error;
  return data;
}

export interface OrgChartCompany {
  id: string;
  name: string;
}

export async function fetchCompaniesForOrgChart(): Promise<OrgChartCompany[]> {
  const { data, error } = await supabase.from("companies").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export interface OrgChartContact {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  contact_reason: string | null;
  reports_to: string | null;
}

export async function fetchOrgChart(companyId: string): Promise<OrgChartContact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, role_title, email, phone, contact_reason, reports_to")
    .eq("company_id", companyId)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export interface NewOrgChartContactInput {
  companyId: string;
  fullName: string;
  roleTitle: string;
  contactReason: string;
  email: string;
  phone: string;
  reportsTo: string | null;
}

export async function addOrgChartContact(input: NewOrgChartContactInput) {
  const { error } = await supabase.from("contacts").insert({
    company_id: input.companyId,
    full_name: input.fullName.trim(),
    role_title: input.roleTitle.trim() || null,
    contact_reason: input.contactReason.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    reports_to: input.reportsTo,
  });
  if (error) throw error;
}

export type TenantSettings = Database["public"]["Tables"]["tenant_settings"]["Row"];
export type TenantSettingsInput = Partial<
  Pick<
    TenantSettings,
    "color_accent" | "color_accent_deep" | "color_moss" | "color_moss_light" | "color_amber" | "color_terracotta" | "color_legado"
  >
>;

export async function fetchTenantSettings(): Promise<TenantSettings> {
  const { data, error } = await supabase.from("tenant_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function updateTenantSettings(input: TenantSettingsInput): Promise<TenantSettings> {
  const { data, error } = await supabase
    .from("tenant_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Busca el lead más reciente asociado a un contacto (para navegar a su perfil desde el Organigrama). */
export async function fetchLeadIdForContact(contactId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export type InstalledModule = Database["public"]["Tables"]["installed_modules"]["Row"];

/** Módulos opcionales instalados/habilitados para todo el equipo (p.ej. Organigrama), desde el Marketplace. */
export async function fetchInstalledModules(): Promise<InstalledModule[]> {
  const { data, error } = await supabase.from("installed_modules").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function setModuleEnabled(moduleKey: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("installed_modules")
    .upsert({ module_key: moduleKey, enabled, updated_at: new Date().toISOString() }, { onConflict: "module_key" });
  if (error) throw error;
}

export type EmailRow = Database["public"]["Tables"]["emails"]["Row"];

export interface SendEmailInput {
  leadId?: string;
  contactId?: string;
  to: string;
  subject: string;
  bodyHtml: string;
}

/**
 * Envía un correo real (Edge Function -> Resend), con tracking de apertura y
 * clics, y lo agrega al timeline del lead si se indica `leadId`.
 */
export async function sendEmail(input: SendEmailInput): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      leadId: input.leadId ?? null,
      contactId: input.contactId ?? null,
      to: input.to,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      createdBy: session?.user.id ?? null,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);

  const emailId = data.emailId as string;

  if (input.leadId) {
    await supabase.from("timeline_events").insert({
      lead_id: input.leadId,
      type: "email",
      title: `Correo enviado: ${input.subject}`,
      description: input.bodyHtml.replace(/<[^>]+>/g, " ").trim().slice(0, 240),
      email_id: emailId,
    });
  }

  return emailId;
}

/** Estado de tracking (enviado/abierto/clic) de correos ya enviados, para mostrar en el timeline. */
export async function fetchEmailsByIds(ids: string[]): Promise<EmailRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("emails").select("*").in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductInput = Pick<
  Database["public"]["Tables"]["products"]["Insert"],
  "name" | "description" | "category" | "price" | "status"
>;

export async function fetchProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const { data, error } = await supabase.from("products").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductRow> {
  const { data, error } = await supabase.from("products").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export type LeadSyntheticInsight = Database["public"]["Tables"]["lead_synthetic_insights"]["Row"];

/** Última corrida del análisis de IA para un lead (persona, producto recomendado, score, métricas). */
export async function fetchLatestInsight(leadId: string): Promise<LeadSyntheticInsight | null> {
  const { data, error } = await supabase
    .from("lead_synthetic_insights")
    .select("*")
    .eq("lead_id", leadId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Dispara la Edge Function que llama a Gemini con los datos reales del lead +
 * el catálogo, y guarda el resultado estructurado (persona, producto
 * recomendado, probabilidad de éxito, métricas) en `lead_synthetic_insights`.
 */
export async function generateLeadInsight(leadId: string): Promise<LeadSyntheticInsight> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("generate-lead-insight", {
    body: { leadId, createdBy: session?.user.id ?? null },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);

  return data.insight as LeadSyntheticInsight;
}
