import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { daysSince, type LeadRecord } from "../../lib/crm";

interface KanbanCardProps {
  card: LeadRecord;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
  sectorLabel: string;
}

export function KanbanCard({ card, onDragStart, onDragEnd, dragging, sectorLabel }: KanbanCardProps) {
  const days = daysSince(card.created_at);
  const sector = card.sector ?? "";

  return (
    <div
      className={"kcard" + (dragging ? " is-dragging" : "")}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
    >
      <div className="kcard__top">
        <span className="kcard__company">{card.company?.name ?? "Sin empresa"}</span>
        <span className={`badge badge-${sector}`}>{sectorLabel}</span>
      </div>
      <div className="kcard__contact">{card.contact?.full_name ?? "Sin contacto"}</div>
      <div className="kcard__footer">
        {card.closed ? (
          <span className="kcard__days is-success">
            <CheckCircle2 size={12} strokeWidth={2} /> Cerrado
          </span>
        ) : card.lost ? (
          <span className="kcard__days is-danger">
            <XCircle size={12} strokeWidth={2} /> Perdido
          </span>
        ) : (
          <span className="kcard__days">
            <Clock size={12} strokeWidth={2} /> {days} {days === 1 ? "día" : "días"}
          </span>
        )}
      </div>
    </div>
  );
}
