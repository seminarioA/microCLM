import { useRef, useState } from "react";
import { Camera, CheckCircle2, Mail, Save, ShieldCheck, User } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useAuth } from "../../auth/AuthContext";
import { updateProfile, uploadAvatar } from "../../lib/crm";
import "./MyProfile.css";

export function MyProfile() {
  const { profile, session, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [roleTitle, setRoleTitle] = useState(profile?.role_title ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!session) return null;

  const displayName = profile?.full_name ?? session.user.email ?? "Usuario";
  const avatarSrc =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1c1b17&color=F5F3E8&size=160&bold=true`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile(session!.user.id, { full_name: fullName.trim(), role_title: roleTitle.trim() });
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      await uploadAvatar(session!.user.id, file);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <ModuleHeader title="Mi Perfil" subtitle="Datos de tu cuenta en el equipo comercial" />

      <div className="myprofile panel">
        <div className="myprofile__avatar">
          <img src={avatarSrc} alt={displayName} />
          <button
            type="button"
            className="myprofile__avatar-edit"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Cambiar foto de perfil"
          >
            <Camera size={14} strokeWidth={2} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="myprofile__avatar-input"
            onChange={handleAvatarChange}
          />
        </div>

        <form className="myprofile__form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="my-name">
              <User size={13} strokeWidth={2} /> Nombre completo
            </label>
            <input id="my-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="my-role">
              <ShieldCheck size={13} strokeWidth={2} /> Cargo / rol
            </label>
            <input id="my-role" type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>
              <Mail size={13} strokeWidth={2} /> Correo
            </label>
            <input type="email" value={session.user.email ?? ""} disabled />
          </div>

          {error && <span className="field-error">{error}</span>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={13} strokeWidth={2} /> {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {saved && (
            <span className="myprofile__saved">
              <CheckCircle2 size={13} strokeWidth={2} /> Perfil actualizado
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
