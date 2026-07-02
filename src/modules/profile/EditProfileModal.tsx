import { useState } from "react";
import { X } from "lucide-react";
import { updateCompanyName, updateContact, type LeadProfile } from "../../lib/crm";
import "./EditProfileModal.css";

interface EditProfileModalProps {
  profile: LeadProfile;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ profile, onClose, onSaved }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile.contact.full_name);
  const [roleTitle, setRoleTitle] = useState(profile.contact.role_title ?? "");
  const [email, setEmail] = useState(profile.contact.email ?? "");
  const [phone, setPhone] = useState(profile.contact.phone ?? "");
  const [linkedin, setLinkedin] = useState(profile.contact.linkedin_url ?? "");
  const [companyName, setCompanyName] = useState(profile.company.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateContact(profile.contactId, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        role_title: roleTitle.trim() || null,
        linkedin_url: linkedin.trim() || null,
      });

      if (profile.companyId && companyName.trim() && companyName.trim() !== profile.company.name) {
        await updateCompanyName(profile.companyId, companyName);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-card__header">
          <h3>Editar perfil</h3>
          <button type="button" className="modal-card__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="edit-name">Nombre completo</label>
          <input id="edit-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="edit-company">Empresa</label>
          <input id="edit-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="edit-role">Cargo</label>
          <input id="edit-role" type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="edit-email">Correo</label>
          <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="edit-phone">Teléfono</label>
          <input id="edit-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="edit-linkedin">LinkedIn</label>
          <input id="edit-linkedin" type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </div>

        {error && <span className="field-error">{error}</span>}

        <div className="modal-card__actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
