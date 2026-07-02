import { useRef, useState } from "react";
import { Camera, CircleUserRound, Columns3, IdCard, LogOut, PieChart, Radar, ShieldCheck, UserPlus } from "lucide-react";
import type { ModuleId } from "../../App";
import { useAuth } from "../../auth/AuthContext";
import { uploadAvatar } from "../../lib/crm";
import "./Sidebar.css";

const NAV_ITEMS: { id: ModuleId; label: string; icon: typeof Columns3 }[] = [
  { id: "kanban", label: "Tablero", icon: Columns3 },
  { id: "form", label: "Captación", icon: UserPlus },
  { id: "osint", label: "Prospección", icon: Radar },
  { id: "dashboard", label: "Dashboard", icon: PieChart },
  { id: "profiles", label: "Perfiles", icon: IdCard },
  { id: "myProfile", label: "Mi Perfil", icon: CircleUserRound },
];

interface SidebarProps {
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name ?? session?.user.email ?? "Usuario";
  const roleTitle = profile?.role_title ?? "Administrador";
  const avatarSrc =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1c1b17&color=F5F3E8&size=128&bold=true`;

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
    <aside className="sidebar">
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
          <ShieldCheck size={12} strokeWidth={2} /> {roleTitle}
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
        <button type="button" className="sidebar__footer-btn" onClick={signOut}>
          <LogOut size={14} strokeWidth={1.75} />
          <span>Cerrar sesión</span>
        </button>
        <span>microCLM · La Segunda Mordida</span>
      </div>
    </aside>
  );
}
