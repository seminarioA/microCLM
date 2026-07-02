import { useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarClock,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  StickyNote,
  Tag,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { initialTimeline } from "../../data/mockData";
import type { TimelineEntry, TimelineType } from "../../types";
import "./ClientProfile.css";

const TIMELINE_ICON: Record<TimelineType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: CalendarClock,
  note: StickyNote,
};

const QUICK_ACTIONS: { type: TimelineType; label: string }[] = [
  { type: "note", label: "Nota" },
  { type: "call", label: "Llamada" },
  { type: "email", label: "Correo" },
];

export function ClientProfile() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);
  const [note, setNote] = useState("");

  function registerAction(type: TimelineType, label: string) {
    const text = note.trim();
    if (!text) return;

    const entry: TimelineEntry = {
      id: `t-${Date.now()}`,
      type,
      title: `${label} registrada`,
      date: "Ahora mismo",
      description: text,
    };
    setTimeline((prev) => [entry, ...prev]);
    setNote("");
  }

  return (
    <section>
      <ModuleHeader
        title="Perfil del Cliente"
        subtitle="Historial completo de interacciones"
        actions={
          <button type="button" className="btn btn-outline">
            <Pencil size={13} strokeWidth={2} /> Editar perfil
          </button>
        }
      />

      <div className="profile-layout">
        <aside className="profile-panel panel">
          <div className="profile-panel__pic">
            <img
              src="https://ui-avatars.com/api/?name=Harold+Rodriguez&background=1c1b17&color=F5F3E8&size=96"
              alt="Harold Rodriguez"
            />
          </div>
          <h2 className="profile-panel__name">Harold Rodriguez</h2>
          <span className="profile-panel__code">CRM-2026-0042</span>

          <div className="profile-panel__details">
            <div className="detail-row">
              <Building2 size={15} strokeWidth={1.75} />
              <div>
                <small>Empresa</small>
                <p>TechSolutions Perú</p>
              </div>
            </div>
            <div className="detail-row">
              <Briefcase size={15} strokeWidth={1.75} />
              <div>
                <small>Cargo</small>
                <p>CEO &amp; Fundador</p>
              </div>
            </div>
            <div className="detail-row">
              <Mail size={15} strokeWidth={1.75} />
              <div>
                <small>Correo</small>
                <p>harold@techsolutions.pe</p>
              </div>
            </div>
            <div className="detail-row">
              <Phone size={15} strokeWidth={1.75} />
              <div>
                <small>Teléfono</small>
                <p>+51 920 645 820</p>
              </div>
            </div>
            <div className="detail-row">
              <Link2 size={15} strokeWidth={1.75} />
              <div>
                <small>LinkedIn</small>
                <p>linkedin.com/in/harolrodriguez</p>
              </div>
            </div>
            <div className="detail-row">
              <Tag size={15} strokeWidth={1.75} />
              <div>
                <small>Rubro</small>
                <span className="badge badge-software">Software</span>
              </div>
            </div>
            <div className="detail-row">
              <MapPin size={15} strokeWidth={1.75} />
              <div>
                <small>Estado en pipeline</small>
                <span className="stage-badge">Negociación</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="timeline-panel">
          <div className="quick-action panel">
            <textarea
              className="quick-action__input"
              placeholder="Escribe una nota, programa una llamada o escribe un correo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="quick-action__buttons">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.type}
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => registerAction(a.type, a.label)}
                >
                  {(() => {
                    const Icon = TIMELINE_ICON[a.type];
                    return <Icon size={13} strokeWidth={2} />;
                  })()}
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="timeline">
            {timeline.map((item) => {
              const Icon = TIMELINE_ICON[item.type];
              return (
                <div className="timeline-item" key={item.id}>
                  <div className={`timeline-item__icon is-${item.type}`}>
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <div className="timeline-item__content">
                    <div className="timeline-item__header">
                      <strong>{item.title}</strong>
                      <span>{item.date}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
