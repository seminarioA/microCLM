import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  Camera,
  LayoutGrid,
  LayoutList,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  StickyNote,
  Tag,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useSectors } from "../../hooks/useSectors";
import { mailtoLink, whatsappLink } from "../../lib/contactLinks";
import {
  addTimelineEvent,
  fetchLeadProfile,
  fetchLeads,
  fetchStages,
  fetchTimeline,
  uploadContactAvatar,
  type LeadProfile,
  type LeadRecord,
  type PipelineStage,
  type TimelineEvent,
} from "../../lib/crm";
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

const VIEW_MODE_KEY = "microclm-profiles-view";
type ViewMode = "list" | "grid";

function ProfilesList({ onSelect }: { onSelect: (id: string) => void }) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null) ?? "list",
  );
  const { sectors, labelOf } = useSectors();

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  useEffect(() => {
    Promise.all([fetchLeads(), fetchStages()])
      .then(([leadsData, stagesData]) => {
        setLeads(leadsData);
        setStages(stagesData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (sectorFilter !== "all" && (lead.sector ?? "") !== sectorFilter) return false;
      if (stageFilter !== "all" && lead.stage_id !== stageFilter) return false;
      return true;
    });
  }, [leads, sectorFilter, stageFilter]);

  if (loading) return <p className="osint-empty">Cargando perfiles...</p>;
  if (leads.length === 0) return <p className="osint-empty">Aún no hay leads registrados en el pipeline.</p>;

  const stageLabel = (stageId: string) => stages.find((s) => s.id === stageId)?.label ?? "Sin etapa";

  return (
    <>
      <div className="profiles-filters">
        <div className="dash-filter-group">
          <span className="eyebrow">Rubro</span>
          <select className="dash-select" value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}>
            <option value="all">Todos</option>
            {sectors.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dash-filter-group">
          <span className="eyebrow">Etapa</span>
          <select className="dash-select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">Todas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="profiles-view-toggle">
          <button
            type="button"
            className={"profiles-view-toggle__btn" + (viewMode === "list" ? " is-active" : "")}
            onClick={() => changeViewMode("list")}
            title="Ver en lista"
          >
            <LayoutList size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className={"profiles-view-toggle__btn" + (viewMode === "grid" ? " is-active" : "")}
            onClick={() => changeViewMode("grid")}
            title="Ver en grilla"
          >
            <LayoutGrid size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <p className="osint-empty">Ningún perfil coincide con los filtros seleccionados.</p>
      ) : viewMode === "list" ? (
        <div className="profiles-list panel">
          {filteredLeads.map((lead) => (
            <button type="button" key={lead.id} className="profiles-list__row" onClick={() => onSelect(lead.id)}>
              <img
                src={
                  lead.contact?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.contact?.full_name ?? "?")}&background=1c1b17&color=F5F3E8&size=64`
                }
                alt={lead.contact?.full_name ?? "Sin nombre"}
              />
              <div className="profiles-list__info">
                <strong>{lead.contact?.full_name ?? "Sin contacto"}</strong>
                <span>{lead.company?.name ?? "Sin empresa"}</span>
              </div>
              <span className={`badge badge-${lead.sector ?? ""}`}>{labelOf(lead.sector)}</span>
              <span className="stage-badge">{stageLabel(lead.stage_id)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="profiles-grid">
          {filteredLeads.map((lead) => (
            <button type="button" key={lead.id} className="profiles-grid__card panel" onClick={() => onSelect(lead.id)}>
              <img
                src={
                  lead.contact?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.contact?.full_name ?? "?")}&background=1c1b17&color=F5F3E8&size=96`
                }
                alt={lead.contact?.full_name ?? "Sin nombre"}
              />
              <strong>{lead.contact?.full_name ?? "Sin contacto"}</strong>
              <span>{lead.company?.name ?? "Sin empresa"}</span>
              <div className="profiles-grid__badges">
                <span className={`badge badge-${lead.sector ?? ""}`}>{labelOf(lead.sector)}</span>
                <span className="stage-badge">{stageLabel(lead.stage_id)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function ClientProfile({ leadId }: ClientProfileProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(leadId);
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { labelOf } = useSectors();

  useEffect(() => {
    setSelectedId(leadId);
  }, [leadId]);

  const load = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    fetchLeadProfile(selectedId)
      .then(async (p) => {
        setProfile(p);
        setTimeline(p ? await fetchTimeline(p.leadId) : []);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;

    setUploadingPhoto(true);
    try {
      await uploadContactAvatar(profile.contactId, file);
      load();
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!selectedId) {
    return (
      <section>
        <ModuleHeader title="Perfiles" subtitle="Directorio de contactos y leads del pipeline" />
        <ProfilesList onSelect={setSelectedId} />
      </section>
    );
  }

  if (loading || !profile) {
    return (
      <section>
        <ModuleHeader
          title="Perfil del Cliente"
          subtitle="Historial completo de interacciones"
          actions={
            <button type="button" className="btn btn-outline" onClick={() => setSelectedId(undefined)}>
              <ArrowLeft size={13} strokeWidth={2} /> Volver a Perfiles
            </button>
          }
        />
        <p className="osint-empty">Cargando perfil...</p>
      </section>
    );
  }

  return (
    <section>
      <ModuleHeader
        title="Perfil del Cliente"
        subtitle="Historial completo de interacciones"
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setSelectedId(undefined)}>
              <ArrowLeft size={13} strokeWidth={2} /> Volver a Perfiles
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
              <Pencil size={13} strokeWidth={2} /> Editar perfil
            </button>
            <button type="button" className="btn btn-outline" onClick={() => window.print()}>
              <Printer size={13} strokeWidth={2} /> Imprimir
            </button>
          </>
        }
      />

      <div className="profile-layout profile-layout--printable">
        <aside className="profile-panel panel">
          <div className="profile-panel__pic">
            <img
              src={
                profile.contact.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.contact.full_name)}&background=1c1b17&color=F5F3E8&size=96`
              }
              alt={profile.contact.full_name}
            />
            <button
              type="button"
              className="profile-panel__pic-edit"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Cambiar foto"
            >
              <Camera size={13} strokeWidth={2} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="profile-panel__pic-input"
              onChange={handlePhotoChange}
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
                {profile.contact.email ? (
                  <a className="detail-link" href={mailtoLink(profile.contact.email)}>
                    {profile.contact.email}
                  </a>
                ) : (
                  <p>Sin correo</p>
                )}
              </div>
            </div>
            <div className="detail-row">
              <Phone size={15} strokeWidth={1.75} />
              <div>
                <small>Teléfono</small>
                {profile.contact.phone ? (
                  <a
                    className="detail-link"
                    href={whatsappLink(profile.contact.phone)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {profile.contact.phone}
                  </a>
                ) : (
                  <p>Sin teléfono</p>
                )}
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
                <span className={`badge badge-${profile.sector ?? ""}`}>{labelOf(profile.sector)}</span>
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
