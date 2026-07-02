import { useEffect, useState } from "react";
import { CheckCircle2, Palette, RotateCcw, Save } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useAuth } from "../../auth/AuthContext";
import { fetchTenantSettings, updateTenantSettings, type TenantSettingsInput } from "../../lib/crm";
import { applyTenantColors } from "../../theme/brand";
import "./Settings.css";

const COLOR_FIELDS: { key: keyof TenantSettingsInput; label: string }[] = [
  { key: "color_accent", label: "Primario" },
  { key: "color_accent_deep", label: "Primario (énfasis)" },
  { key: "color_moss", label: "Secundario" },
  { key: "color_moss_light", label: "Secundario (claro)" },
  { key: "color_amber", label: "Terciario" },
  { key: "color_terracotta", label: "Cuarto acento" },
  { key: "color_legado", label: "Quinto acento" },
];

/** Colores de fábrica del tenant (los mismos que trae `tokens.css`): hoy, la paleta de La Segunda Mordida. */
const DEFAULT_TENANT_COLORS: TenantSettingsInput = {
  color_accent: "#f27405",
  color_accent_deep: "#d93d04",
  color_moss: "#365902",
  color_moss_light: "#76b948",
  color_amber: "#ffa50e",
  color_terracotta: "#de8033",
  color_legado: "#d6401e",
};

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

  function handleRestoreDefaults() {
    setValues((v) => (v ? { ...v, ...DEFAULT_TENANT_COLORS } : v));
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
            <Palette size={13} strokeWidth={2} /> Estos colores ya están cargados con la configuración actual del
            equipo. Cambiarlos aquí actualiza la marca en toda la app para todo el equipo, o usa "Restaurar valores
            por defecto" para volver a los colores de fábrica del tenant.
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

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={13} strokeWidth={2} /> {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleRestoreDefaults}>
              <RotateCcw size={13} strokeWidth={2} /> Restaurar valores por defecto
            </button>
          </div>

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
