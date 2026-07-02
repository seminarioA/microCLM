import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  FileText,
  Handshake,
  Phone,
  Plus,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { NotificationBell } from "../../components/layout/NotificationBell";
import { KanbanCard } from "./KanbanCard";
import { fetchLeads, fetchStages, updateLeadStage, type LeadRecord, type PipelineStage } from "../../lib/crm";
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

  useEffect(() => {
    Promise.all([fetchStages(), fetchLeads()])
      .then(([stagesData, leadsData]) => {
        setStages(stagesData);
        setLeads(leadsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleDragStart(e: React.DragEvent, cardId: string) {
    setDraggingId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggingId) return;

    const leadId = draggingId;
    setDraggingId(null);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage_id: targetStageId } : l)));

    updateLeadStage(leadId, targetStageId).catch((err) => setError(err.message));
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
          <>
            <NotificationBell />
            <button type="button" className="btn btn-primary">
              <Plus size={14} strokeWidth={2} /> Nuevo lead
            </button>
          </>
        }
      />

      {error && <p className="field-error">{error}</p>}

      <div className="kanban-board">
        {stages.map((stage) => {
          const Icon = STAGE_ICONS[stage.key] ?? UserPlus;
          const cards = leads.filter((l) => l.stage_id === stage.id);
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
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={"kanban-column__header" + (stage.variant ? ` is-${stage.variant}` : "")}>
                <h3>
                  <Icon size={13} strokeWidth={2} /> {stage.label}
                </h3>
                <span className="kanban-column__count">{cards.length}</span>
              </div>
              <div className="kanban-column__cards">
                {cards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    dragging={draggingId === card.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
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
