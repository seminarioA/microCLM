import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  Building2,
  Fingerprint,
  GlobeCheck,
  MapPin,
  Newspaper,
  Radar,
  ShieldCheck,
  UserSearch,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { generateOsintProfile, OSINT_LOADING_TEXTS, type OsintProfile, type OsintSignal } from "./osintMock";
import "./Osint.css";

type Step = "idle" | "loading" | "result";

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
  const [profile, setProfile] = useState<OsintProfile | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStep("loading");
    setLoadingTextIndex(0);

    let idx = 0;
    const interval = window.setInterval(() => {
      idx = Math.min(idx + 1, OSINT_LOADING_TEXTS.length - 1);
      setLoadingTextIndex(idx);
    }, 480);
    timers.current.push(interval);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setProfile(generateOsintProfile(name, company));
      setStep("result");
    }, 2400);
    timers.current.push(timeout);
  }

  function handleReset() {
    setStep("idle");
    setProfile(null);
    setName("");
    setCompany("");
  }

  return (
    <section>
      <ModuleHeader
        title="Prospección OSINT"
        subtitle="Enriquecimiento de prospectos a partir de fuentes públicas y abiertas"
      />

      <div className="osint-search panel">
        <form className="osint-search__form" onSubmit={handleSubmit}>
          <div className="osint-search__field">
            <label htmlFor="osint-name">
              <UserSearch size={13} strokeWidth={2} /> Nombre completo <span className="required">*</span>
            </label>
            <input
              id="osint-name"
              type="text"
              placeholder="Ej. Diego Silva"
              value={name}
              className={nameError ? "is-error" : ""}
              onChange={(e) => {
                setName(e.target.value);
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
            <Radar size={14} strokeWidth={2} /> Buscar en fuentes públicas
          </button>
        </form>
      </div>

      {step === "loading" && (
        <div className="osint-loading panel">
          <div className="osint-loading__spinner">
            <Radar size={26} strokeWidth={1.6} />
          </div>
          <h3>Rastreando fuentes abiertas</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((loadingTextIndex + 1) / OSINT_LOADING_TEXTS.length) * 100}%` }}
            />
          </div>
          <p className="osint-loading__text">{OSINT_LOADING_TEXTS[loadingTextIndex]}</p>
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
              <p>
                {profile.role} · {profile.company}
              </p>
              <div className="osint-profile__meta">
                <span>
                  <MapPin size={12} strokeWidth={2} /> {profile.location}
                </span>
                <span className="badge badge-software">{profile.sector}</span>
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
                <p className="osint-empty">Sin menciones públicas recientes.</p>
              ) : (
                profile.mentions.map((m) => (
                  <div className="mention-row" key={m.title}>
                    <p>{m.title}</p>
                    <small>
                      {m.source} · {m.date}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="osint-disclaimer">
            <ShieldCheck size={14} strokeWidth={2} />
            <p>
              Resultados simulados con fines de demostración a partir de fuentes públicas y abiertas. No se accede a
              bases de datos privadas ni información confidencial.
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
