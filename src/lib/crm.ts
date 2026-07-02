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

/** Elige el lead con historial de interacciones más antiguo como perfil destacado. */
export async function fetchFeaturedProfile(): Promise<LeadProfile | null> {
  const { data: firstEvent } = await supabase
    .from("timeline_events")
    .select("lead_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let leadId = firstEvent?.lead_id;

  if (!leadId) {
    const { data: latestLead } = await supabase
      .from("leads")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    leadId = latestLead?.id;
  }

  if (!leadId) return null;

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, sector, stage:pipeline_stages(label), contact:contacts(full_name, email, phone, role_title, linkedin_url), company:companies(name)",
    )
    .eq("id", leadId)
    .single();
  if (error) throw error;

  const stage = one(data.stage as unknown as { label: string } | { label: string }[]);
  const contact = one(
    data.contact as unknown as LeadProfile["contact"] | LeadProfile["contact"][],
  );
  const company = one(data.company as unknown as LeadProfile["company"] | LeadProfile["company"][]);

  return {
    leadId: data.id,
    stageLabel: stage?.label ?? "Sin etapa",
    sector: data.sector,
    contact: contact ?? { full_name: "Sin nombre", email: null, phone: null, role_title: null, linkedin_url: null },
    company: company ?? { name: "Sin empresa" },
  };
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
