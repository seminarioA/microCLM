import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { CompanyAutocomplete } from "../../components/shared/CompanyAutocomplete";
import { useSectors } from "../../hooks/useSectors";
import { createLeadFromOsint, createSector, type CompanySuggestion, type OsintSearchProfile } from "../../lib/crm";

interface AddToProfilesModalProps {
  profile: OsintSearchProfile;
  estimatedEmail?: string;
  linkedinUrl?: string;
  photoUrls?: string[];
  onClose: () => void;
  onCreated: (leadId: string) => void;
}

export function AddToProfilesModal({
  profile,
  estimatedEmail,
  linkedinUrl,
  photoUrls,
  onClose,
  onCreated,
}: AddToProfilesModalProps) {
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [sector, setSector] = useState("");
  const [addingSector, setAddingSector] = useState(false);
  const [newSectorLabel, setNewSectorLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sectors, addSector } = useSectors();

  function handleSelectCompany(c: CompanySuggestion) {
    setCompanyId(c.id);
  }

  async function handleAddSector() {
    const label = newSectorLabel.trim();
    if (!label) return;
    const created = await createSector(label);
    addSector(created);
    setSector(created.key);
    setNewSectorLabel("");
    setAddingSector(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!sector) {
      setError("Selecciona un rubro");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createLeadFromOsint({
        name,
        sector,
        company: company.trim() || undefined,
        companyId,
        email: estimatedEmail,
        linkedinUrl,
        photoUrls,
      });
      onCreated(created.leadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-card__header">
          <h3>
            <UserPlus size={15} strokeWidth={2} /> Agregar a Perfiles
          </h3>
          <button type="button" className="modal-card__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="osint-add-name">Nombre completo</label>
          <input id="osint-add-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="osint-add-company">Empresa</label>
          <CompanyAutocomplete
            id="osint-add-company"
            value={company}
            onChange={(v) => {
              setCompany(v);
              setCompanyId(undefined);
            }}
            onSelectCompany={handleSelectCompany}
            placeholder="Nombre de la empresa (opcional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="osint-add-sector">Rubro</label>
          <select
            id="osint-add-sector"
            value={sector}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setAddingSector(true);
                return;
              }
              setSector(e.target.value);
            }}
          >
            <option value="">Selecciona un rubro</option>
            {sectors.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
            <option value="__new__">+ Agregar nuevo rubro...</option>
          </select>
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

        {(estimatedEmail || linkedinUrl || (photoUrls && photoUrls.length > 0)) && (
          <p className="osint-add-summary">
            Se guardarán también los datos detectados por OSINT:{" "}
            {[
              estimatedEmail && `correo estimado ${estimatedEmail}`,
              linkedinUrl && `LinkedIn ${linkedinUrl}`,
              photoUrls && photoUrls.length > 0 && `${photoUrls.length} foto(s) seleccionada(s)`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        {error && <span className="field-error">{error}</span>}

        <div className="modal-card__actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Creando..." : "Crear perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}
