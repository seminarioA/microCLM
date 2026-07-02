import { useState } from "react";
import {
  AtSign,
  Building2,
  Fingerprint,
  GlobeCheck,
  Newspaper,
  Radar,
  ShieldCheck,
  UserSearch,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { NameAutocomplete } from "../../components/shared/NameAutocomplete";
import { runOsintSearch, type OsintSearchProfile, type OsintSignal } from "../../lib/crm";
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

export function OsintProspecting() {
  const [step, setStep] = useState<Step>("idle");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [nameError, setNameError] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [profile, setProfile] = useState<OsintSearchProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const result = await runOsintSearch(name, company);
      setProfile(result);
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
            <input
              id="osint-company"
              type="text"
              placeholder="Ej. MegaCorp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1c1b17&color=F5F3E8&size=72`}
              alt={profile.name}
            />
            <div>
              <h3>{profile.name}</h3>
              <p>{profile.company || "Sin empresa especificada"}</p>
              <div className="osint-profile__meta">
                <span>{profile.resultCount} resultados encontrados en DuckDuckGo</span>
              </div>
            </div>
          </div>

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

          <button type="button" className="btn btn-outline" onClick={handleReset}>
            <Fingerprint size={13} strokeWidth={2} /> Nueva búsqueda
          </button>
        </div>
      )}
    </section>
  );
}
