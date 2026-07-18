import { Network, PersonStanding } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useInstalledModules } from "../../hooks/useInstalledModules";
import "./Marketplace.css";

interface MarketplaceModuleDef {
  key: string;
  name: string;
  description: string;
  icon: typeof Network;
}

/** Catálogo de módulos opcionales de microCLM. Nuevos módulos se agregan aquí. */
const AVAILABLE_MODULES: MarketplaceModuleDef[] = [
  {
    key: "orgchart",
    name: "Organigrama",
    description: "Mapa visual de los contactos de una empresa: jerarquía, cargos y motivo de contacto.",
    icon: Network,
  },
  {
    key: "synthetic_lead",
    name: "Lead Sintético",
    description:
      "Análisis con IA (Groq) de un lead real: gustos, preferencias, producto/servicio recomendado del Catálogo, probabilidad de cierre y métricas.",
    icon: PersonStanding,
  },
];

export function Marketplace() {
  const { loading, isEnabled, toggle } = useInstalledModules();

  return (
    <section>
      <ModuleHeader
        title="Marketplace de módulos"
        subtitle="Instala o desactiva módulos opcionales para todo el equipo"
      />

      {loading ? (
        <p className="osint-empty">Cargando módulos...</p>
      ) : (
        <div className="marketplace-grid">
          {AVAILABLE_MODULES.map(({ key, name, description, icon: Icon }) => {
            const enabled = isEnabled(key);
            return (
              <div className="marketplace-card panel" key={key}>
                <div className="marketplace-card__icon">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className="marketplace-card__info">
                  <strong>{name}</strong>
                  <p>{description}</p>
                </div>
                <button
                  type="button"
                  className={"marketplace-card__toggle" + (enabled ? " is-on" : "")}
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggle(key, !enabled)}
                  title={enabled ? "Desactivar módulo" : "Activar módulo"}
                >
                  <span className="marketplace-card__toggle-knob" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
