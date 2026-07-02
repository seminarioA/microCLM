import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, BellRing, Clock } from "lucide-react";
import { fetchNotifications, markNotificationRead, type NotificationRow } from "../../lib/crm";
import { supabase } from "../../lib/supabaseClient";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from "../../lib/browserNotifications";
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

interface NotificationBellProps {
  onSelectLead?: (leadId: string) => void;
}

export function NotificationBell({ onSelectLead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | null>(() => getNotificationPermission());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  // Notificaciones reales del navegador: cualquier fila nueva en `notifications`
  // (creada por este usuario o cualquier otro del equipo) dispara un aviso del
  // sistema operativo, no solo el badge de la campanita dentro de la app.
  useEffect(() => {
    const channel = supabase
      .channel("notifications-push")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          setNotifications((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
          showBrowserNotification(row.title, row.message ?? "");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  async function handleEnableBrowserNotifications(e: React.MouseEvent) {
    e.stopPropagation();
    const result = await requestNotificationPermission();
    if (result) setPermission(result);
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen((v) => {
      const next = !v;
      if (next) fetchNotifications().then(setNotifications);
      return next;
    });
  }

  async function handleSelect(n: NotificationRow) {
    if (!n.read) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.lead_id && onSelectLead) {
      onSelectLead(n.lead_id);
      setOpen(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif" ref={ref}>
      <button type="button" className="notif__trigger" onClick={handleToggle}>
        <Bell size={17} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="notif__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif__dropdown">
          <div className="notif__header">Notificaciones</div>
          {permission === "default" && (
            <button type="button" className="notif__enable-browser" onClick={handleEnableBrowserNotifications}>
              <BellRing size={13} strokeWidth={2} /> Activar notificaciones del navegador
            </button>
          )}
          {notifications.length === 0 ? (
            <div className="notif__item">
              <p>No hay notificaciones.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, color } = ICON_MAP[n.icon ?? ""] ?? { icon: Bell, color: "var(--color-ink-soft)" };
              return (
                <button
                  type="button"
                  className={"notif__item" + (n.read ? "" : " is-unread") + (n.lead_id ? " is-clickable" : "")}
                  key={n.id}
                  onClick={() => handleSelect(n)}
                >
                  <Icon size={15} strokeWidth={2} color={color} />
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>{timeAgo(n.created_at)}</small>
                  </div>
                  {!n.read && <span className="notif__dot" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
