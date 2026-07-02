export type Sector =
  | "mineria"
  | "software"
  | "retail"
  | "finanzas"
  | "construccion"
  | "salud"
  | "educacion";

export interface LeadCard {
  id: string;
  company: string;
  contact: string;
  sector: Sector;
  days: number;
  closed?: boolean;
  lost?: boolean;
}

export interface KanbanStageDef {
  id: string;
  label: string;
  variant?: "success" | "danger";
}

export type TimelineType = "call" | "email" | "meeting" | "note";

export interface TimelineEntry {
  id: string;
  type: TimelineType;
  title: string;
  date: string;
  description: string;
}
