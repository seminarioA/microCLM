import { useEffect, useState } from "react";
import { CheckCircle2, Palette, Save } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useAuth } from "../../auth/AuthContext";
import { fetchTenantSettings, updateTenantSettings, type TenantSettingsInput } from "../../lib/crm";
import { applyTenantColors } from "../../theme/brand";
import "./Settings.css";

const COLOR_FIELDS: { key: keyof TenantSettingsInput; label: string }[] = [
  { key: "color_accent", label: "Acento principal" },
  { key: "color_accent_deep", label: "Acento (hover / énfasis)" },
  { key: "color_moss", label: "Musgo" },
  { key: "color_moss_light", label: "Musgo claro" },
  { key: "color_amber", label: "Ámbar" },
  { key: "color_terracotta", label: "Terracota" },
  { key: "color_legado", label: "Legado" },
];

export function Settings() {
  const { profile } = useAuth();
  const [values, setValues] = useState<TenantSettingsInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantSettings()
      .then(setValues)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  if (profile && profile.role !== "admin") {
    return (
      <section>
        <ModuleHeader title="Configuración" subtitle="Colores de marca del tenant" />
        <p className="osint-empty">Solo un administrador puede editar la configuración.</p>
      </section>
    );
  }

  function handleChange(key: keyof TenantSettingsInput, value: string) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateTenantSettings(values);
      applyTenantColors(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <ModuleHeader
        title="Configuración"
        subtitle="Colores de marca del tenant que implementa microCLM (hoy: La Segunda Mordida)"
      />

      {loading && <p className="osint-empty">Cargando configuración...</p>}

      {!loading && values && (
        <form className="settings-panel panel" onSubmit={handleSave}>
          <p className="settings-desc">
            <Palette size={13} strokeWidth={2} /> Estos colores ya están cargados con la configuración actual de La
            Segunda Mordida. Cambiarlos aquí actualiza la marca en toda la app para todo el equipo.
          </p>

          <div className="settings-grid">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div className="settings-field" key={key}>
                <label htmlFor={key}>{label}</label>
                <div className="settings-color-input">
                  <input
                    type="color"
                    aria-label={label}
                    value={values[key] ?? "#000000"}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                  <input
                    id={key}
                    type="text"
                    value={values[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <span className="field-error">{error}</span>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={13} strokeWidth={2} /> {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {saved && (
            <span className="myprofile__saved">
              <CheckCircle2 size={13} strokeWidth={2} /> Configuración actualizada
            </span>
          )}
        </form>
      )}
    </section>
  );
}
