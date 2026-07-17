import { useState } from "react";
import {
  AtSign,
  Building2,
  Check,
  Fingerprint,
  GlobeCheck,
  ImagePlus,
  Newspaper,
  Radar,
  ShieldCheck,
  UserPlus,
  UserSearch,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { NameAutocomplete } from "../../components/shared/NameAutocomplete";
import { CompanyAutocomplete } from "../../components/shared/CompanyAutocomplete";
import { resolveCompany, runOsintSearch, type CompanySuggestion, type OsintSearchProfile, type OsintSignal } from "../../lib/crm";
import { AddToProfilesModal } from "./AddToProfilesModal";
import "./Osint.css";

type Step = "idle" | "loading" | "result" | "error";

const LOADING_TEXTS = [
  "Consultando DuckDuckGo...",
  "Analizando resultados públicos...",
  "Detectando presencia digital...",
  "Consolidando perfil de prospección...",
];

function SignalRow({ signal }: { signal: OsintSignal }) {
  return (
    <div className="signal-row">
      <div>
        <small>{signal.label}</small>
        <p>{signal.value}</p>
      </div>
      <span className={`confidence confidence-${signal.confidence.toLowerCase()}`}>{signal.confidence}</span>
    </div>
  );
}

/** Extrae la URL de LinkedIn de las señales OSINT, si de verdad se encontró una. */
function extractLinkedin(profile: OsintSearchProfile): string | undefined {
  const signal = profile.digitalFootprint.find((s) => s.label === "LinkedIn");
  return signal && /^https?:\/\//.test(signal.value) ? signal.value : undefined;
}

/** Extrae el correo estimado de las señales OSINT, si de verdad se pudo estimar uno. */
function extractEstimatedEmail(profile: OsintSearchProfile): string | undefined {
  const signal = profile.contact.find((s) => s.label === "Patrón de correo estimado");
  return signal && signal.value.includes("@") ? signal.value : undefined;
}

interface OsintProspectingProps {
  onLeadCreated?: (leadId: string) => void;
}

export function OsintProspecting({ onLeadCreated }: OsintProspectingProps) {
  const [step, setStep] = useState<Step>("idle");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [nameError, setNameError] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [profile, setProfile] = useState<OsintSearchProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingToProfiles, setAddingToProfiles] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  function togglePhoto(url: string) {
    setSelectedPhotos((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStep("loading");
    setLoadingTextIndex(0);
    setError(null);

    const interval = window.setInterval(() => {
      setLoadingTextIndex((i) => Math.min(i + 1, LOADING_TEXTS.length - 1));
    }, 900);

    try {
      // No dependas de que el usuario haga click en una sugerencia: si la
      // empresa escrita ya existe, se resuelve sola al lanzar la búsqueda.
      let resolvedCompany = company.trim();
      if (resolvedCompany) {
        const match = await resolveCompany(resolvedCompany);
        if (match) {
          resolvedCompany = match.name;
          setCompany(match.name);
        }
      }

      const result = await runOsintSearch(name, resolvedCompany);
      setProfile(result);
      setSelectedPhotos(result.photoCandidates?.length ? [result.photoCandidates[0].url] : []);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la búsqueda");
      setStep("error");
    } finally {
      window.clearInterval(interval);
    }
  }

  function handleReset() {
    setStep("idle");
    setProfile(null);
    setError(null);
    setName("");
    setCompany("");
    setSelectedPhotos([]);
  }

  return (
    <section>
      <ModuleHeader
        title="Prospección OSINT"
        subtitle="Enriquecimiento de prospectos con búsqueda real en DuckDuckGo"
      />

      <div className="osint-search panel">
        <form className="osint-search__form" onSubmit={handleSubmit}>
          <div className="osint-search__field">
            <label htmlFor="osint-name">
              <UserSearch size={13} strokeWidth={2} /> Nombre completo <span className="required">*</span>
            </label>
            <NameAutocomplete
              id="osint-name"
              placeholder="Ej. Diego Silva"
              value={name}
              className={nameError ? "is-error" : ""}
              onChange={(v) => {
                setName(v);
                setNameError(false);
              }}
            />
            {nameError && <span className="field-error">Ingresa un nombre para iniciar la búsqueda</span>}
          </div>
          <div className="osint-search__field">
            <label htmlFor="osint-company">
              <Building2 size={13} strokeWidth={2} /> Empresa (opcional)
            </label>
            <CompanyAutocomplete
              id="osint-company"
              placeholder="Ej. MegaCorp"
              value={company}
              onChange={setCompany}
              onSelectCompany={(c: CompanySuggestion) => setCompany(c.name)}
            />
          </div>
          <button type="submit" className="btn btn-primary osint-search__submit" disabled={step === "loading"}>
            <Radar size={14} strokeWidth={2} /> Buscar en DuckDuckGo
          </button>
        </form>
      </div>

      {step === "loading" && (
        <div className="osint-loading panel">
          <div className="osint-loading__spinner">
            <Radar size={26} strokeWidth={1.6} />
          </div>
          <h3>Buscando en fuentes públicas</h3>
          <p className="osint-loading__text">{LOADING_TEXTS[loadingTextIndex]}</p>
        </div>
      )}

      {step === "error" && (
        <div className="osint-loading panel">
          <p className="field-error">{error}</p>
          <button type="button" className="btn btn-outline" onClick={handleReset}>
            <Fingerprint size={13} strokeWidth={2} /> Intentar de nuevo
          </button>
        </div>
      )}

      {step === "result" && profile && (
        <div className="osint-result">
          <div className="osint-profile panel">
            <div className="osint-profile__pic">
              <img
                src={
                  selectedPhotos[0] ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1c1b17&color=F5F3E8&size=72`
                }
                alt={profile.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1c1b17&color=F5F3E8&size=72`;
                }}
              />
              {profile.photoCandidates?.find((c) => c.url === selectedPhotos[0])?.source === "search" && (
                <span className="osint-profile__pic-caption" title="Encontrada por búsqueda de imagen general, no confirmada como esta persona">
                  Foto sin confirmar
                </span>
              )}
            </div>
            <div>
              <h3>{profile.name}</h3>
              <p>{profile.company || "Sin empresa especificada"}</p>
              <div className="osint-profile__meta">
                <span>{profile.resultCount} resultados encontrados en DuckDuckGo</span>
              </div>
            </div>
          </div>

          {profile.photoCandidates && profile.photoCandidates.length > 0 && (
            <div className="osint-photos panel">
              <div className="osint-card__header">
                <h4>
                  <ImagePlus size={13} strokeWidth={2} /> Fotos encontradas
                </h4>
              </div>
              <p className="osint-photos__hint">
                Elige la o las fotos correctas de esta persona. Se guardarán al presionar "Agregar a Perfiles".
              </p>
              <div className="osint-photos__grid">
                {profile.photoCandidates.map((candidate) => {
                  const isSelected = selectedPhotos.includes(candidate.url);
                  return (
                    <button
                      type="button"
                      key={candidate.url}
                      className={`osint-photo-option${isSelected ? " is-selected" : ""}`}
                      onClick={() => togglePhoto(candidate.url)}
                    >
                      <img
                        src={candidate.url}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.closest(".osint-photo-option")?.remove();
                        }}
                      />
                      <span className="osint-photo-option__check">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {candidate.source === "search" && (
                        <span className="osint-photo-option__tag">Sin confirmar</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="osint-grid">
            <div className="osint-card panel">
              <div className="osint-card__header">
                <h4>
                  <GlobeCheck size={13} strokeWidth={2} /> Presencia digital
                </h4>
              </div>
              {profile.digitalFootprint.map((s) => (
                <SignalRow signal={s} key={s.label} />
              ))}
            </div>

            <div className="osint-card panel">
              <div className="osint-card__header">
                <h4>
                  <Building2 size={13} strokeWidth={2} /> Empresa
                </h4>
              </div>
              {profile.companyInfo.map((s) => (
                <SignalRow signal={s} key={s.label} />
              ))}
            </div>

            <div className="osint-card panel">
              <div className="osint-card__header">
                <h4>
                  <AtSign size={13} strokeWidth={2} /> Contacto estimado
                </h4>
              </div>
              {profile.contact.map((s) => (
                <SignalRow signal={s} key={s.label} />
              ))}
            </div>

            <div className="osint-card panel osint-card--mentions">
              <div className="osint-card__header">
                <h4>
                  <Newspaper size={13} strokeWidth={2} /> Menciones públicas
                </h4>
              </div>
              {profile.mentions.length === 0 ? (
                <p className="osint-empty">Sin menciones públicas adicionales.</p>
              ) : (
                profile.mentions.map((m) => (
                  <div className="mention-row" key={m.url}>
                    <p>
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.title}
                      </a>
                    </p>
                    <small>{m.source}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="osint-disclaimer">
            <ShieldCheck size={14} strokeWidth={2} />
            <p>
              Resultados obtenidos en tiempo real desde DuckDuckGo (fuentes públicas y abiertas). El patrón de correo
              y el sitio corporativo son estimaciones a partir de los resultados, no datos verificados.
            </p>
          </div>

          <div className="osint-result__actions">
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              <Fingerprint size={13} strokeWidth={2} /> Nueva búsqueda
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setAddingToProfiles(true)}>
              <UserPlus size={13} strokeWidth={2} /> Agregar a Perfiles
            </button>
          </div>
        </div>
      )}

      {addingToProfiles && profile && (
        <AddToProfilesModal
          profile={profile}
          estimatedEmail={extractEstimatedEmail(profile)}
          linkedinUrl={extractLinkedin(profile)}
          photoUrls={selectedPhotos}
          onClose={() => setAddingToProfiles(false)}
          onCreated={(leadId) => {
            setAddingToProfiles(false);
            handleReset();
            onLeadCreated?.(leadId);
          }}
        />
      )}
    </section>
  );
}
