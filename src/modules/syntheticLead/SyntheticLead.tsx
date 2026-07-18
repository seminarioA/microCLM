import { useEffect, useState } from "react";
import { ArrowLeft, Brain, RefreshCw, Sparkles, Target } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useSectors } from "../../hooks/useSectors";
import {
  fetchLatestInsight,
  fetchLeadProfile,
  fetchLeads,
  fetchProducts,
  generateLeadInsight,
  type LeadProfile,
  type LeadRecord,
  type LeadSyntheticInsight,
  type ProductRow,
} from "../../lib/crm";
import "./SyntheticLead.css";

const METRIC_LABELS: Record<string, string> = {
  engagement: "Interés mostrado",
  sector_fit: "Encaje con el rubro",
  budget_fit: "Encaje de presupuesto",
  urgency: "Urgencia",
};

function LeadPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { labelOf } = useSectors();

  useEffect(() => {
    fetchLeads()
      .then(setLeads)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="osint-empty">Cargando leads...</p>;
  if (leads.length === 0) return <p className="osint-empty">Aún no hay leads registrados en el pipeline.</p>;

  return (
    <div className="profiles-list panel">
      {leads.map((lead) => (
        <button type="button" key={lead.id} className="profiles-list__row" onClick={() => onSelect(lead.id)}>
          <img
            src={
              lead.contact?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.contact?.full_name ?? "?")}&background=1c1b17&color=F5F3E8&size=64`
            }
            alt={lead.contact?.full_name ?? "Sin nombre"}
          />
          <div className="profiles-list__info">
            <strong>{lead.contact?.full_name ?? "Sin contacto"}</strong>
            <span>{lead.company?.name ?? "Sin empresa"}</span>
          </div>
          <span className={`badge badge-${lead.sector ?? ""}`}>{labelOf(lead.sector)}</span>
        </button>
      ))}
    </div>
  );
}

interface SyntheticLeadProps {
  leadId?: string;
}

export function SyntheticLead({ leadId }: SyntheticLeadProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(leadId);
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [insight, setInsight] = useState<LeadSyntheticInsight | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(leadId);
  }, [leadId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchLeadProfile(selectedId), fetchLatestInsight(selectedId), fetchProducts()])
      .then(([p, i, prods]) => {
        setProfile(p);
        setInsight(i);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  async function handleGenerate() {
    if (!selectedId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateLeadInsight(selectedId);
      setInsight(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el análisis");
    } finally {
      setGenerating(false);
    }
  }

  if (!selectedId) {
    return (
      <section>
        <ModuleHeader
          title="Lead Sintético"
          subtitle="Elige un lead para analizar sus gustos, preferencias y probabilidad de cierre con IA"
        />
        <LeadPicker onSelect={setSelectedId} />
      </section>
    );
  }

  const recommendedProduct = insight?.recommended_product_id
    ? products.find((p) => p.id === insight.recommended_product_id)
    : null;

  return (
    <section>
      <ModuleHeader
        title="Lead Sintético"
        subtitle="Análisis de IA sobre gustos, preferencias y probabilidad de cierre"
        actions={
          <button type="button" className="btn btn-outline" onClick={() => setSelectedId(undefined)}>
            <ArrowLeft size={13} strokeWidth={2} /> Elegir otro lead
          </button>
        }
      />

      {loading || !profile ? (
        <p className="osint-empty">Cargando lead...</p>
      ) : (
        <div className="synthetic-lead">
          <div className="synthetic-lead__header panel">
            <div>
              <strong>{profile.contact.full_name}</strong>
              <span>{profile.company.name} · {profile.stageLabel}</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {insight ? <RefreshCw size={13} strokeWidth={2} /> : <Sparkles size={13} strokeWidth={2} />}
              {generating ? "Analizando..." : insight ? "Regenerar análisis" : "Generar análisis"}
            </button>
          </div>

          {error && <p className="field-error synthetic-lead__error">{error}</p>}

          {!insight && !generating && !error && (
            <p className="osint-empty">Aún no hay un análisis generado para este lead.</p>
          )}

          {insight && (
            <div className="synthetic-lead__grid">
              <div className="panel synthetic-lead__card">
                <h4>
                  <Brain size={15} strokeWidth={1.75} /> Persona y preferencias
                </h4>
                <p>{insight.persona_summary}</p>
                {Array.isArray(insight.preferences) && insight.preferences.length > 0 && (
                  <div className="synthetic-lead__chips">
                    {(insight.preferences as string[]).map((pref, i) => (
                      <span className="synthetic-lead__chip" key={i}>
                        {pref}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel synthetic-lead__card">
                <h4>
                  <Target size={15} strokeWidth={1.75} /> Producto/servicio recomendado
                </h4>
                {recommendedProduct ? (
                  <>
                    <strong>{recommendedProduct.name}</strong>
                    <p>{insight.recommended_product_reason}</p>
                  </>
                ) : (
                  <p>Ningún producto del catálogo encaja con este lead todavía.</p>
                )}
              </div>

              <div className="panel synthetic-lead__card synthetic-lead__score">
                <h4>Puntuación general</h4>
                <div className="synthetic-lead__score-value">{Math.round(insight.score)}</div>
                <span>Probabilidad de cierre: {Math.round(insight.success_probability * 100)}%</span>
                {insight.score_reason && <p className="synthetic-lead__score-reason">{insight.score_reason}</p>}
              </div>

              <div className="panel synthetic-lead__card synthetic-lead__metrics">
                <h4>Métricas</h4>
                {Object.entries((insight.metrics as Record<string, number>) ?? {}).map(([key, value]) => (
                  <div className="synthetic-lead__metric" key={key}>
                    <div className="synthetic-lead__metric-header">
                      <span>{METRIC_LABELS[key] ?? key}</span>
                      <span>{Math.round(value)}</span>
                    </div>
                    <div className="synthetic-lead__metric-bar">
                      <div className="synthetic-lead__metric-fill" style={{ width: `${Math.round(value)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
