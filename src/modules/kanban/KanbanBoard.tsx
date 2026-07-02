import { useState } from "react";
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
import { initialBoard, stageDefs } from "../../data/mockData";
import type { LeadCard } from "../../types";
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
  const [board, setBoard] = useState<Record<string, LeadCard[]>>(initialBoard);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, cardId: string) {
    setDraggingId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggingId) return;

    setBoard((prev) => {
      let movedCard: LeadCard | undefined;
      const next: Record<string, LeadCard[]> = {};
      for (const [stage, cards] of Object.entries(prev)) {
        const filtered = cards.filter((c) => {
          if (c.id === draggingId) {
            movedCard = c;
            return false;
          }
          return true;
        });
        next[stage] = filtered;
      }
      if (movedCard) {
        next[targetStage] = [...next[targetStage], movedCard];
      }
      return next;
    });
    setDraggingId(null);
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

      <div className="kanban-board">
        {stageDefs.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const cards = board[stage.id] ?? [];
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
