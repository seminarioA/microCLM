import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Handshake,
  Phone,
  Plus,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { KanbanCard } from "./KanbanCard";
import { useSectors } from "../../hooks/useSectors";
import {
  createNotification,
  fetchLeads,
  fetchStages,
  updateLeadStage,
  type LeadRecord,
  type PipelineStage,
} from "../../lib/crm";
import "./Kanban.css";

const STAGE_ICONS: Record<string, typeof UserPlus> = {
  "lead-captado": UserPlus,
  "lead-calificado": CheckCircle,
  contacto: Phone,
  reunion: CalendarCheck,
  propuesta: FileText,
  negociacion: Handshake,
  cierre: Trophy,
  perdido: XCircle,
};

export function KanbanBoard() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { labelOf } = useSectors();

  useEffect(() => {
    Promise.all([fetchStages(), fetchLeads()])
      .then(([stagesData, leadsData]) => {
        setStages(stagesData);
        setLeads(leadsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleCollapse(stageId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, cardId: string) {
    setDraggingId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDrop(e: React.DragEvent, targetStage: PipelineStage) {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggingId) return;

    const leadId = draggingId;
    const movedLead = leads.find((l) => l.id === leadId);
    setDraggingId(null);
    if (!movedLead || movedLead.stage_id === targetStage.id) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage_id: targetStage.id } : l)));

    updateLeadStage(leadId, targetStage.id).catch((err) => setError(err.message));

    createNotification({
      title: "Cambio de etapa",
      message: `${movedLead.company?.name ?? "Un lead"} (${movedLead.contact?.full_name ?? "sin contacto"}) avanzó a ${targetStage.label}`,
      icon: "arrow",
      leadId,
    }).catch(() => {});
  }

  if (loading) {
    return (
      <section>
        <ModuleHeader title="Tablero Kanban" subtitle="Pipeline de ventas · Trazabilidad completa" />
        <p className="osint-empty">Cargando pipeline...</p>
      </section>
    );
  }

  return (
    <section>
      <ModuleHeader
        title="Tablero Kanban"
        subtitle="Pipeline de ventas · Trazabilidad completa"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={14} strokeWidth={2} /> Nuevo lead
          </button>
        }
      />

      {error && <p className="field-error">{error}</p>}

      <div className="kanban-board">
        {stages.map((stage) => {
          const Icon = STAGE_ICONS[stage.key] ?? UserPlus;
          const cards = leads.filter((l) => l.stage_id === stage.id);
          const isCollapsed = collapsed.has(stage.id);

          if (isCollapsed) {
            return (
              <div key={stage.id} className="kanban-column is-collapsed">
                <button
                  type="button"
                  className="kanban-column__expand"
                  onClick={() => toggleCollapse(stage.id)}
                  title="Expandir columna"
                >
                  <ChevronRight size={14} strokeWidth={2} />
                  <span>{stage.label}</span>
                  <span className="kanban-column__count">{cards.length}</span>
                </button>
              </div>
            );
          }

          return (
            <div
              key={stage.id}
              className={"kanban-column" + (dragOverStage === stage.id ? " is-over" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className={"kanban-column__header" + (stage.variant ? ` is-${stage.variant}` : "")}>
                <h3>
                  <Icon size={13} strokeWidth={2} /> {stage.label}
                </h3>
                <div className="kanban-column__header-right">
                  <span className="kanban-column__count">{cards.length}</span>
                  <button
                    type="button"
                    className="kanban-column__collapse"
                    onClick={() => toggleCollapse(stage.id)}
                    title="Minimizar columna"
                  >
                    <ChevronLeft size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="kanban-column__cards">
                {cards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    dragging={draggingId === card.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    sectorLabel={labelOf(card.sector)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
