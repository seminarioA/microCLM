import { useRef, useState } from "react";
import {
  Camera,
  CircleUserRound,
  Columns3,
  IdCard,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Radar,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { ModuleId } from "../../App";
import { useAuth } from "../../auth/AuthContext";
import { uploadAvatar } from "../../lib/crm";
import { brand } from "../../theme/brand";
import "./Sidebar.css";

const NAV_ITEMS: { id: ModuleId; label: string; icon: typeof Columns3 }[] = [
  { id: "kanban", label: "Tablero", icon: Columns3 },
  { id: "form", label: "Captación", icon: UserPlus },
  { id: "osint", label: "Prospección", icon: Radar },
  { id: "orgchart", label: "Organigrama", icon: Network },
  { id: "dashboard", label: "Dashboard", icon: PieChart },
  { id: "profiles", label: "Perfiles", icon: IdCard },
];

const COLLAPSE_KEY = "microclm-sidebar-collapsed";

interface SidebarProps {
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name ?? session?.user.email ?? "Usuario";
  const cargo = profile?.role_title ?? "Sin cargo";
  const avatarSrc =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1c1b17&color=F5F3E8&size=128&bold=true`;

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session) return;

    setUploading(true);
    try {
      await uploadAvatar(session.user.id, file);
      await refreshProfile();
    } catch (err) {
      console.error("No se pudo subir la foto de perfil", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <aside className={"sidebar" + (collapsed ? " is-collapsed" : "")}>
        <button
          type="button"
          className="sidebar__collapse-toggle"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menú" : "Compactar menú"}
        >
          {collapsed ? <PanelLeftOpen size={15} strokeWidth={1.75} /> : <PanelLeftClose size={15} strokeWidth={1.75} />}
        </button>

        <div className="sidebar__profile">
          <div className="sidebar__avatar">
            <img src={avatarSrc} alt={displayName} />
            <span className="sidebar__status-dot" />
            <button
              type="button"
              className="sidebar__avatar-edit"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Cambiar foto de perfil"
            >
              <Camera size={13} strokeWidth={2} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sidebar__avatar-input"
              onChange={handleAvatarChange}
            />
          </div>
          <h2 className="sidebar__greeting">{displayName}</h2>
          <span className="sidebar__role">
            <ShieldCheck size={12} strokeWidth={2} /> {cargo}
          </span>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={"sidebar__nav-item" + (active === id ? " is-active" : "")}
              onClick={() => onSelect(id)}
              title={label}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__account">
          <button
            type="button"
            className={"sidebar__nav-item" + (active === "myProfile" ? " is-active" : "")}
            onClick={() => onSelect("myProfile")}
            title="Mi Perfil"
          >
            <CircleUserRound size={17} strokeWidth={1.75} />
            <span>Mi Perfil</span>
          </button>
        </div>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__footer-btn" onClick={signOut} title="Cerrar sesión">
            <LogOut size={14} strokeWidth={1.75} />
            <span>Cerrar sesión</span>
          </button>
          <span>
            {brand.productName} · {brand.tenantShortName}
          </span>
        </div>
      </aside>

      <nav className="mobile-dock">
        {NAV_ITEMS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={"mobile-dock__item" + (active === id ? " is-active" : "")}
            onClick={() => onSelect(id)}
          >
            <Icon size={19} strokeWidth={1.75} />
          </button>
        ))}
        <button
          type="button"
          className={"mobile-dock__item" + (active === "myProfile" ? " is-active" : "")}
          onClick={() => onSelect("myProfile")}
        >
          <CircleUserRound size={19} strokeWidth={1.75} />
        </button>
      </nav>
    </>
  );
}
