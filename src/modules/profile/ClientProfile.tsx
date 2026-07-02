import { useCallback, useEffect, useState } from "react";
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
import { SECTOR_LABEL } from "../../data/mockData";
import { addTimelineEvent, fetchLeadProfile, fetchTimeline, type LeadProfile, type TimelineEvent } from "../../lib/crm";
import { EditProfileModal } from "./EditProfileModal";
import "./ClientProfile.css";

const TIMELINE_ICON: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: CalendarClock,
  note: StickyNote,
};

const QUICK_ACTIONS: { type: string; label: string }[] = [
  { type: "note", label: "Nota" },
  { type: "call", label: "Llamada" },
  { type: "email", label: "Correo" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ClientProfileProps {
  leadId?: string;
}

export function ClientProfile({ leadId }: ClientProfileProps) {
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchLeadProfile(leadId)
      .then(async (p) => {
        setProfile(p);
        setTimeline(p ? await fetchTimeline(p.leadId) : []);
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function registerAction(type: string, label: string) {
    const text = note.trim();
    if (!text || !profile) return;

    const entry = await addTimelineEvent(profile.leadId, type, `${label} registrada`, text);
    setTimeline((prev) => [entry, ...prev]);
    setNote("");
  }

  if (loading) {
    return (
      <section>
        <ModuleHeader title="Perfil del Cliente" subtitle="Historial completo de interacciones" />
        <p className="osint-empty">Cargando perfil...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section>
        <ModuleHeader title="Perfil del Cliente" subtitle="Historial completo de interacciones" />
        <p className="osint-empty">Aún no hay leads registrados en el pipeline.</p>
      </section>
    );
  }

  return (
    <section>
      <ModuleHeader
        title="Perfil del Cliente"
        subtitle="Historial completo de interacciones"
        actions={
          <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
            <Pencil size={13} strokeWidth={2} /> Editar perfil
          </button>
        }
      />

      <div className="profile-layout">
        <aside className="profile-panel panel">
          <div className="profile-panel__pic">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.contact.full_name)}&background=1c1b17&color=F5F3E8&size=96`}
              alt={profile.contact.full_name}
            />
          </div>
          <h2 className="profile-panel__name">{profile.contact.full_name}</h2>
          <span className="profile-panel__code">{profile.company.name}</span>

          <div className="profile-panel__details">
            <div className="detail-row">
              <Building2 size={15} strokeWidth={1.75} />
              <div>
                <small>Empresa</small>
                <p>{profile.company.name}</p>
              </div>
            </div>
            <div className="detail-row">
              <Briefcase size={15} strokeWidth={1.75} />
              <div>
                <small>Cargo</small>
                <p>{profile.contact.role_title ?? "Sin cargo registrado"}</p>
              </div>
            </div>
            <div className="detail-row">
              <Mail size={15} strokeWidth={1.75} />
              <div>
                <small>Correo</small>
                <p>{profile.contact.email ?? "Sin correo"}</p>
              </div>
            </div>
            <div className="detail-row">
              <Phone size={15} strokeWidth={1.75} />
              <div>
                <small>Teléfono</small>
                <p>{profile.contact.phone ?? "Sin teléfono"}</p>
              </div>
            </div>
            <div className="detail-row">
              <Link2 size={15} strokeWidth={1.75} />
              <div>
                <small>LinkedIn</small>
                <p>{profile.contact.linkedin_url ?? "No disponible"}</p>
              </div>
            </div>
            <div className="detail-row">
              <Tag size={15} strokeWidth={1.75} />
              <div>
                <small>Rubro</small>
                <span className={`badge badge-${profile.sector ?? "software"}`}>
                  {SECTOR_LABEL[profile.sector ?? ""] ?? "Sin rubro"}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <MapPin size={15} strokeWidth={1.75} />
              <div>
                <small>Estado en pipeline</small>
                <span className="stage-badge">{profile.stageLabel}</span>
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
              const Icon = TIMELINE_ICON[item.type] ?? StickyNote;
              return (
                <div className="timeline-item" key={item.id}>
                  <div className={`timeline-item__icon is-${item.type}`}>
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <div className="timeline-item__content">
                    <div className="timeline-item__header">
                      <strong>{item.title}</strong>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </section>
  );
}
