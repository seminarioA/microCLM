import { Columns3, IdCard, PieChart, ShieldCheck, UserPlus } from "lucide-react";
import type { ModuleId } from "../../App";
import "./Sidebar.css";

const NAV_ITEMS: { id: ModuleId; label: string; icon: typeof Columns3 }[] = [
  { id: "kanban", label: "Tablero", icon: Columns3 },
  { id: "form", label: "Captación", icon: UserPlus },
  { id: "dashboard", label: "Dashboard", icon: PieChart },
  { id: "profile", label: "Perfil", icon: IdCard },
];

interface SidebarProps {
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__profile">
        <div className="sidebar__avatar">
          <img
            src="https://ui-avatars.com/api/?name=Joel+Yovera&background=1c1b17&color=F5F3E8&size=128&bold=true"
            alt="Joel Yovera"
          />
          <span className="sidebar__status-dot" />
        </div>
        <h2 className="sidebar__greeting">Joel Yovera</h2>
        <span className="sidebar__role">
          <ShieldCheck size={12} strokeWidth={2} /> Administrador
        </span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={"sidebar__nav-item" + (active === id ? " is-active" : "")}
            onClick={() => onSelect(id)}
          >
            <Icon size={17} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span>microCLM · La Segunda Mordida</span>
      </div>
    </aside>
  );
}
