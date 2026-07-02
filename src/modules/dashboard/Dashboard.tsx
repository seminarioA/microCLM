import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { ArrowDown, Building2, Clock, FileSpreadsheet, FileText, Filter, Users } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { funnelStages } from "../../data/mockData";
import { useTheme } from "../../theme/ThemeContext";
import "./chartSetup";
import "./Dashboard.css";

const PERIODS = [
  { id: "week", label: "Semanal" },
  { id: "month", label: "Mensual" },
  { id: "year", label: "Anual" },
];

const leadsData = {
  labels: ["Referidos", "Web", "LinkedIn", "Ferias", "Email"],
  datasets: [
    {
      label: "Leads",
      data: [40, 65, 35, 25, 50],
      backgroundColor: ["#f27405", "#d93d04", "#de8033", "#ffa50e", "#365902"],
      borderRadius: 3,
      barThickness: 34,
    },
  ],
};

const rubroData = {
  labels: ["Minería", "Software", "Retail", "Finanzas", "Construcción"],
  datasets: [
    {
      data: [45, 55, 35, 28, 20],
      backgroundColor: ["#de8033", "#365902", "#f27405", "#d6401e", "#9b9888"],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
};

export function Dashboard() {
  const [period, setPeriod] = useState("week");
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "rgba(242, 239, 226, 0.08)" : "#e6e2d4";
  const tickColor = theme === "dark" ? "#8a8570" : "#9b9888";
  const tickColorStrong = theme === "dark" ? "#c9c4b0" : "#6f6d61";

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

      <div className="kpi-grid">
        <div className="kpi-card panel">
          <div className="kpi-card__header">
            <h3>
              <Filter size={13} strokeWidth={2} /> Tasa de conversión por etapa
            </h3>
          </div>
          <div className="funnel">
            {funnelStages.map((stage) => (
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
            18<span>días</span>
          </div>
          <div className="kpi-trend is-positive">
            <ArrowDown size={12} strokeWidth={2} /> 12% vs mes anterior
          </div>
        </div>

        <div className="kpi-card panel is-full">
          <div className="kpi-card__header">
            <h3>
              <Users size={13} strokeWidth={2} /> Leads por canal
            </h3>
          </div>
          <div className="chart-container">
            <Bar
              data={leadsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { size: 11 } },
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
              data={rubroData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { padding: 14, usePointStyle: true, pointStyle: "circle", color: tickColorStrong, font: { size: 11 } },
                  },
                },
                cutout: "62%",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
