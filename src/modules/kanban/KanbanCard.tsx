import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { SECTOR_LABEL } from "../../data/mockData";
import type { LeadCard } from "../../types";

interface KanbanCardProps {
  card: LeadCard;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function KanbanCard({ card, onDragStart, onDragEnd, dragging }: KanbanCardProps) {
  return (
    <div
      className={"kcard" + (dragging ? " is-dragging" : "")}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
    >
      <div className="kcard__top">
        <span className="kcard__company">{card.company}</span>
        <span className={`badge badge-${card.sector}`}>{SECTOR_LABEL[card.sector]}</span>
      </div>
      <div className="kcard__contact">{card.contact}</div>
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
            <Clock size={12} strokeWidth={2} /> {card.days} {card.days === 1 ? "día" : "días"}
          </span>
        )}
      </div>
    </div>
  );
}
