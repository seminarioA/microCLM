import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Building2, Clock, FileSpreadsheet, FileText, Filter, Users } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { SECTOR_LABEL } from "../../data/mockData";
import { useTheme } from "../../theme/ThemeContext";
import {
  averageCloseDays,
  countBy,
  fetchLeadsForAnalytics,
  fetchStages,
  type AnalyticsLead,
  type PipelineStage,
} from "../../lib/crm";
import "./chartSetup";
import "./Dashboard.css";

const PERIODS = [
  { id: "week", label: "Semanal" },
  { id: "month", label: "Mensual" },
  { id: "year", label: "Anual" },
];

const CHANNEL_LABELS = ["Web", "Referidos", "LinkedIn", "Ferias", "Email"];
const CHANNEL_COLORS = ["#f27405", "#d93d04", "#de8033", "#ffa50e", "#365902"];
const SECTOR_COLORS: Record<string, string> = {
  mineria: "#de8033",
  software: "#365902",
  retail: "#f27405",
  finanzas: "#d6401e",
  construccion: "#9b9888",
  salud: "#76b948",
  educacion: "#ffa50e",
};

export function Dashboard() {
  const [period, setPeriod] = useState("week");
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<AnalyticsLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "rgba(242, 239, 226, 0.08)" : "#e6e2d4";
  const tickColor = theme === "dark" ? "#8a8570" : "#9b9888";
  const tickColorStrong = theme === "dark" ? "#c9c4b0" : "#6f6d61";

  useEffect(() => {
    Promise.all([fetchStages(), fetchLeadsForAnalytics()])
      .then(([stagesData, leadsData]) => {
        setStages(stagesData);
        setLeads(leadsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const funnel = useMemo(() => {
    const counts = stages.map((stage) => leads.filter((l) => l.stage_id === stage.id).length);
    const max = Math.max(1, ...counts);
    return stages.map((stage, i) => ({
      label: stage.label,
      value: counts[i],
      variant: stage.variant,
      width: counts[i] === 0 ? 4 : Math.max(12, Math.round((counts[i] / max) * 100)),
    }));
  }, [stages, leads]);

  const avgCloseDays = useMemo(() => averageCloseDays(leads), [leads]);

  const channelData = useMemo(() => {
    const counts = countBy(leads, "source");
    return {
      labels: CHANNEL_LABELS,
      datasets: [
        {
          label: "Leads",
          data: CHANNEL_LABELS.map((label) => counts[label] ?? 0),
          backgroundColor: CHANNEL_COLORS,
          borderRadius: 3,
          barThickness: 34,
        },
      ],
    };
  }, [leads]);

  const sectorData = useMemo(() => {
    const counts = countBy(leads, "sector");
    const entries = Object.entries(counts).filter(([, count]) => count > 0);
    return {
      labels: entries.map(([sector]) => SECTOR_LABEL[sector] ?? sector),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map(([sector]) => SECTOR_COLORS[sector] ?? "#9b9888"),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };
  }, [leads]);

  return (
    <section>
      <ModuleHeader title="Dashboard Gerencial" subtitle="Rendimiento comercial · KPIs en tiempo real" />

      <div className="dash-filters">
        <div className="dash-filter-group">
          <span className="eyebrow">Período</span>
          <div className="dash-btn-group">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"btn btn-sm btn-outline" + (period === p.id ? " is-active" : "")}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="dash-filter-group">
          <span className="eyebrow">Rubro</span>
          <select className="dash-select" defaultValue="all">
            <option value="all">Todos</option>
            <option value="mineria">Minería</option>
            <option value="software">Software</option>
            <option value="retail">Retail</option>
          </select>
        </div>
        <div className="dash-filter-actions">
          <button type="button" className="btn btn-outline btn-sm">
            <FileText size={13} strokeWidth={2} /> PDF
          </button>
          <button type="button" className="btn btn-outline btn-sm">
            <FileSpreadsheet size={13} strokeWidth={2} /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p className="osint-empty">Cargando indicadores...</p>
      ) : (
        <div className="kpi-grid">
          <div className="kpi-card panel">
            <div className="kpi-card__header">
              <h3>
                <Filter size={13} strokeWidth={2} /> Tasa de conversión por etapa
              </h3>
            </div>
            <div className="funnel">
              {funnel.map((stage) => (
                <div
                  key={stage.label}
                  className={"funnel-stage" + (stage.variant ? ` is-${stage.variant}` : "")}
                  style={{ width: `${stage.width}%` }}
                >
                  <span>{stage.label}</span>
                  <span>{stage.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kpi-card panel">
            <div className="kpi-card__header">
              <h3>
                <Clock size={13} strokeWidth={2} /> Tiempo promedio de cierre
              </h3>
            </div>
            <div className="kpi-big-number">
              {avgCloseDays}
              <span>días</span>
            </div>
            <div className="kpi-trend is-positive">Calculado sobre leads cerrados en el pipeline</div>
          </div>

          <div className="kpi-card panel is-full">
            <div className="kpi-card__header">
              <h3>
                <Users size={13} strokeWidth={2} /> Leads por canal
              </h3>
            </div>
            <div className="chart-container">
              <Bar
                data={channelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, color: tickColor, font: { size: 11 } },
                      grid: { color: gridColor },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: tickColorStrong, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="kpi-card panel is-full">
            <div className="kpi-card__header">
              <h3>
                <Building2 size={13} strokeWidth={2} /> Rendimiento por rubro empresarial
              </h3>
            </div>
            <div className="chart-container">
              <Doughnut
                data={sectorData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 14,
                        usePointStyle: true,
                        pointStyle: "circle",
                        color: tickColorStrong,
                        font: { size: 11 },
                      },
                    },
                  },
                  cutout: "62%",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
