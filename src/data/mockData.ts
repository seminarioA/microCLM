import type { KanbanStageDef, LeadCard, TimelineEntry } from "../types";

export const SECTOR_LABEL: Record<string, string> = {
  mineria: "Minería",
  software: "Software",
  retail: "Retail",
  finanzas: "Finanzas",
  construccion: "Construcción",
  salud: "Salud",
  educacion: "Educación",
};

export const stageDefs: KanbanStageDef[] = [
  { id: "lead-captado", label: "Lead captado" },
  { id: "lead-calificado", label: "Lead calificado" },
  { id: "contacto", label: "Contacto realizado" },
  { id: "reunion", label: "Reunión agendada" },
  { id: "propuesta", label: "Propuesta enviada" },
  { id: "negociacion", label: "Negociación" },
  { id: "cierre", label: "Cierre exitoso", variant: "success" },
  { id: "perdido", label: "Cliente perdido", variant: "danger" },
];

export const initialBoard: Record<string, LeadCard[]> = {
  "lead-captado": [
    { id: "c1", company: "TechSolutions", contact: "Harold Rodriguez", sector: "software", days: 2 },
    { id: "c2", company: "InnovaGroup", contact: "María López", sector: "mineria", days: 5 },
    { id: "c3", company: "CloudBase", contact: "Luis Torres", sector: "software", days: 1 },
  ],
  "lead-calificado": [
    { id: "c4", company: "DataCorp", contact: "Carlos Ruiz", sector: "software", days: 1 },
    { id: "c5", company: "EcoMiner", contact: "Rosa Campos", sector: "mineria", days: 3 },
  ],
  contacto: [
    { id: "c6", company: "GreenEnergy", contact: "Ana Torres", sector: "retail", days: 3 },
    { id: "c7", company: "FreshMarket", contact: "Sofía Rivas", sector: "retail", days: 2 },
  ],
  reunion: [{ id: "c8", company: "Constructora ABC", contact: "Pedro Díaz", sector: "mineria", days: 0 }],
  propuesta: [{ id: "c9", company: "FinServe", contact: "Laura Gómez", sector: "software", days: 4 }],
  negociacion: [{ id: "c10", company: "MegaCorp", contact: "Diego Silva", sector: "retail", days: 7 }],
  cierre: [{ id: "c11", company: "TechGlobal", contact: "Carmen Vega", sector: "software", days: 0, closed: true }],
  perdido: [{ id: "c12", company: "OldSchool", contact: "Roberto Paz", sector: "mineria", days: 0, lost: true }],
};

export const initialTimeline: TimelineEntry[] = [
  {
    id: "t1",
    type: "call",
    title: "Llamada realizada",
    date: "Hoy, 10:30 am",
    description: "Se discuten términos de la propuesta comercial. Cliente interesado en el plan Enterprise.",
  },
  {
    id: "t2",
    type: "email",
    title: "Correo enviado",
    date: "Ayer, 3:15 pm",
    description: "Envío de propuesta comercial actualizada con descuento por volumen.",
  },
  {
    id: "t3",
    type: "meeting",
    title: "Reunión celebrada",
    date: "15 May 2026",
    description: "Videollamada con el equipo directivo. Presentación de la plataforma y demo en vivo.",
  },
  {
    id: "t4",
    type: "note",
    title: "Nota interna",
    date: "12 May 2026",
    description: "Cliente solicita integración con SAP. Contactar con el equipo de desarrollo para evaluar viabilidad.",
  },
  {
    id: "t5",
    type: "call",
    title: "Llamada realizada",
    date: "8 May 2026",
    description: "Primer contacto telefónico. Se agendó reunión virtual para la siguiente semana.",
  },
  {
    id: "t6",
    type: "email",
    title: "Correo de bienvenida",
    date: "5 May 2026",
    description: "Email automatizado de onboarding con enlace al portal del cliente.",
  },
  {
    id: "t7",
    type: "note",
    title: "Lead captado",
    date: "2 May 2026",
    description: "Registro inicial a través del formulario web. Lead asignado al equipo comercial.",
  },
];

export const funnelStages = [
  { label: "Lead captado", value: 43, width: 100 },
  { label: "Lead calificado", value: 34, width: 80 },
  { label: "Contacto realizado", value: 28, width: 65 },
  { label: "Reunión agendada", value: 21, width: 50 },
  { label: "Propuesta enviada", value: 16, width: 38 },
  { label: "Negociación", value: 12, width: 28 },
  { label: "Cierre exitoso", value: 8, width: 18, variant: "success" as const },
  { label: "Perdido", value: 4, width: 10, variant: "danger" as const },
];
