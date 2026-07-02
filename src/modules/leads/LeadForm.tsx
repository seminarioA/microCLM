import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  Globe,
  Link2,
  Mail,
  Phone,
  Plus,
  Tag,
  User,
  Wand2,
} from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useSectors } from "../../hooks/useSectors";
import { createLeadFromForm, createNotification, createSector, type CompanySuggestion } from "../../lib/crm";
import { NameAutocomplete } from "../../components/shared/NameAutocomplete";
import { CompanyAutocomplete } from "../../components/shared/CompanyAutocomplete";
import "./LeadForm.css";

const LOADING_TEXTS = [
  "Analizando fuentes públicas...",
  "Extrayendo información de LinkedIn...",
  "Verificando datos de contacto...",
  "Generando código de lead...",
  "¡Datos enriquecidos exitosamente!",
];

type Step = "form" | "loading" | "success";

interface FormValues {
  email: string;
  name: string;
  empresa: string;
  rubro: string;
}

const EMPTY_FORM: FormValues = { email: "", name: "", empresa: "", rubro: "" };

function validate(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.email.trim()) errors.email = "Campo obligatorio";
  else if (!emailRegex.test(values.email.trim())) errors.email = "Formato de correo inválido";

  if (!values.name.trim()) errors.name = "Campo obligatorio";
  if (!values.empresa.trim()) errors.empresa = "Campo obligatorio";
  if (!values.rubro) errors.rubro = "Selecciona un rubro";

  return errors;
}

export function LeadForm() {
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [leadCode, setLeadCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addingSector, setAddingSector] = useState(false);
  const [newSectorLabel, setNewSectorLabel] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const { sectors, labelOf, addSector } = useSectors();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  function handleBlur(field: keyof FormValues) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  }

  function handleChange(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (field === "empresa") setSelectedCompanyId(undefined);
  }

  function handleSelectCompany(company: CompanySuggestion) {
    setSelectedCompanyId(company.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ email: true, name: true, empresa: true, rubro: true });
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);
    setStep("loading");
    setLoadingTextIndex(0);

    let idx = 0;
    const interval = window.setInterval(() => {
      idx = Math.min(idx + 1, LOADING_TEXTS.length - 1);
      setLoadingTextIndex(idx);
    }, 500);
    timers.current.push(interval);

    const minDuration = new Promise((resolve) => window.setTimeout(resolve, 2400));
    const creation = createLeadFromForm({
      name: values.name,
      email: values.email,
      company: values.empresa,
      sector: values.rubro,
      companyId: selectedCompanyId,
    });

    try {
      const [created] = await Promise.all([creation, minDuration]);
      window.clearInterval(interval);
      setLeadCode(created.code);
      setStep("success");
      createNotification({
        title: "Nuevo lead captado",
        message: `${values.name.trim()} (${values.empresa.trim()}) ingresó al pipeline`,
        icon: "clock",
        leadId: created.leadId,
      }).catch(() => {});
    } catch (err) {
      window.clearInterval(interval);
      setSubmitError(err instanceof Error ? err.message : "No se pudo registrar el lead");
      setStep("form");
    }
  }

  function handleReset() {
    setValues(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSelectedCompanyId(undefined);
    setStep("form");
  }

  async function handleAddSector() {
    const label = newSectorLabel.trim();
    if (!label) return;
    const sector = await createSector(label);
    addSector(sector);
    handleChange("rubro", sector.key);
    setNewSectorLabel("");
    setAddingSector(false);
  }

  return (
    <section>
      <ModuleHeader title="Captación de Leads" subtitle="Formulario inteligente con enriquecimiento de datos" />

      <div className="leadform-container">
        {step !== "success" ? (
          <div className="leadform-card">
            <div className="leadform-progress">
              <div className={"leadform-step" + (step === "form" ? " is-active" : " is-done")}>1</div>
              <div className="leadform-step-line" />
              <div className={"leadform-step" + (step === "loading" ? " is-active" : "")}>2</div>
            </div>

            {step === "form" ? (
              <>
                <h2>Registra un nuevo lead</h2>
                <p className="leadform-desc">Completa los datos y deja que la IA enriquezca la información.</p>
                {submitError && <span className="field-error leadform-submit-error">{submitError}</span>}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={13} strokeWidth={2} /> Correo electrónico <span className="required">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={values.email}
                      className={touched.email && errors.email ? "is-error" : ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                    />
                    {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">
                      <User size={13} strokeWidth={2} /> Nombre completo <span className="required">*</span>
                    </label>
                    <NameAutocomplete
                      id="name"
                      placeholder="Nombre y apellido"
                      value={values.name}
                      className={touched.name && errors.name ? "is-error" : ""}
                      onChange={(v) => handleChange("name", v)}
                      onBlur={() => handleBlur("name")}
                    />
                    {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="empresa">
                      <Building2 size={13} strokeWidth={2} /> Empresa <span className="required">*</span>
                    </label>
                    <CompanyAutocomplete
                      id="empresa"
                      placeholder="Nombre de la empresa"
                      value={values.empresa}
                      className={touched.empresa && errors.empresa ? "is-error" : ""}
                      onChange={(v) => handleChange("empresa", v)}
                      onSelectCompany={handleSelectCompany}
                      onBlur={() => handleBlur("empresa")}
                    />
                    {touched.empresa && errors.empresa && <span className="field-error">{errors.empresa}</span>}
                    {selectedCompanyId && (
                      <span className="leadform-company-linked">Vinculado a empresa existente</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="rubro">
                      <Tag size={13} strokeWidth={2} /> Rubro <span className="required">*</span>
                    </label>
                    <select
                      id="rubro"
                      value={values.rubro}
                      className={touched.rubro && errors.rubro ? "is-error" : ""}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setAddingSector(true);
                          return;
                        }
                        handleChange("rubro", e.target.value);
                      }}
                      onBlur={() => handleBlur("rubro")}
                    >
                      <option value="">Selecciona un rubro</option>
                      {sectors.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                      <option value="__new__">+ Agregar nuevo rubro...</option>
                    </select>
                    {touched.rubro && errors.rubro && <span className="field-error">{errors.rubro}</span>}
                    {addingSector && (
                      <div className="leadform-new-sector">
                        <input
                          type="text"
                          placeholder="Nombre del nuevo rubro"
                          value={newSectorLabel}
                          onChange={(e) => setNewSectorLabel(e.target.value)}
                        />
                        <button type="button" className="btn btn-sm btn-primary" onClick={handleAddSector}>
                          Crear
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setAddingSector(false);
                            setNewSectorLabel("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    <Wand2 size={14} strokeWidth={2} /> Registrar y enriquecer
                  </button>
                </form>
              </>
            ) : (
              <div className="leadform-loading">
                <div className="leadform-spinner">
                  <Bot size={26} strokeWidth={1.6} />
                </div>
                <h3>Enriqueciendo datos con IA</h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((loadingTextIndex + 1) / LOADING_TEXTS.length) * 100}%` }}
                  />
                </div>
                <p className="leadform-loading-text">{LOADING_TEXTS[loadingTextIndex]}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="leadform-card leadform-success">
            <div className="leadform-success-icon">
              <CheckCircle2 size={30} strokeWidth={1.5} />
            </div>
            <h3>¡Lead registrado exitosamente!</h3>
            <div className="lead-profile-card">
              <div className="lead-profile-card__header">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(values.name)}&background=1c1b17&color=F5F3E8&size=64`}
                  alt={values.name}
                />
                <div>
                  <h4>{values.name}</h4>
                  <span className="code-badge">{leadCode}</span>
                </div>
              </div>
              <div className="lead-profile-card__body">
                <div className="info-row">
                  <Mail size={13} strokeWidth={2} /> <span>{values.email}</span>
                </div>
                <div className="info-row">
                  <Building2 size={13} strokeWidth={2} /> <span>{values.empresa}</span>
                </div>
                <div className="info-row">
                  <Tag size={13} strokeWidth={2} />{" "}
                  <span className={`badge badge-${values.rubro}`}>{labelOf(values.rubro)}</span>
                </div>
                <div className="info-row">
                  <Link2 size={13} strokeWidth={2} /> linkedin.com/in/
                  {values.name.toLowerCase().replace(/\s+/g, "")}
                </div>
                <div className="info-row">
                  <Globe size={13} strokeWidth={2} /> www.
                  {values.empresa.toLowerCase().replace(/\s+/g, "")}.pe
                </div>
                <div className="info-row">
                  <Phone size={13} strokeWidth={2} /> +51 987 654 321
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              <Plus size={13} strokeWidth={2} /> Nuevo registro
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
