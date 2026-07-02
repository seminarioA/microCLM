import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, Clock } from "lucide-react";
import { fetchNotifications, type NotificationRow } from "../../lib/crm";
import "./NotificationBell.css";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string }> = {
  clock: { icon: Clock, color: "var(--color-amber)" },
  alert: { icon: AlertTriangle, color: "var(--color-legado)" },
  arrow: { icon: ArrowRight, color: "var(--color-moss-light)" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="notif__trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Bell size={17} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="notif__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif__dropdown">
          <div className="notif__header">Notificaciones</div>
          {notifications.length === 0 ? (
            <div className="notif__item">
              <p>No hay notificaciones.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, color } = ICON_MAP[n.icon ?? ""] ?? { icon: Bell, color: "var(--color-ink-soft)" };
              return (
                <div className="notif__item" key={n.id}>
                  <Icon size={15} strokeWidth={2} color={color} />
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>{timeAgo(n.created_at)}</small>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
