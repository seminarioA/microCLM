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
  contact: { id: string; full_name: string } | null;
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
      "id, sector, closed, lost, created_at, stage_id, source, value, contact:contacts(id, full_name), company:companies(id, name)",
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
}

export interface CreatedLead {
  leadId: string;
  contactId: string;
  companyId: string;
  code: string;
}

/** Crea (o reutiliza) la empresa, el contacto y el lead en la etapa "Lead captado". */
export async function createLeadFromForm(input: NewLeadInput): Promise<CreatedLead> {
  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", input.company.trim())
    .maybeSingle();

  let companyId = existingCompany?.id;
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
      "id, contact_id, company_id, sector, stage:pipeline_stages(label), contact:contacts(full_name, email, phone, role_title, linkedin_url), company:companies(name)",
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
    contact: contact ?? { full_name: "Sin nombre", email: null, phone: null, role_title: null, linkedin_url: null },
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
}

/** Ejecuta la búsqueda OSINT real (Edge Function -> DuckDuckGo) para un nombre/empresa. */
export async function runOsintSearch(name: string, company: string): Promise<OsintSearchProfile> {
  const { data, error } = await supabase.functions.invoke("osint-search", { body: { name, company } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.profile as OsintSearchProfile;
}
