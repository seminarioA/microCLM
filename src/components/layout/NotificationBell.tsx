import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, Clock } from "lucide-react";
import "./NotificationBell.css";

const NOTIFICATIONS = [
  {
    icon: Clock,
    color: "var(--color-amber)",
    title: "Seguimiento pendiente",
    text: "TechSolutions requiere llamada de seguimiento",
    time: "Hace 2 horas",
  },
  {
    icon: AlertTriangle,
    color: "var(--color-legado)",
    title: "Lead inactivo",
    text: "InnovaGroup sin actividad por 15 días",
    time: "Hace 1 día",
  },
  {
    icon: ArrowRight,
    color: "var(--color-moss-light)",
    title: "Cambio de estado",
    text: "DataCorp avanzó a Negociación",
    time: "Hace 3 horas",
  },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

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
        <span className="notif__badge">3</span>
      </button>

      {open && (
        <div className="notif__dropdown">
          <div className="notif__header">Notificaciones</div>
          {NOTIFICATIONS.map((n, i) => (
            <div className="notif__item" key={i}>
              <n.icon size={15} strokeWidth={2} color={n.color} />
              <div>
                <strong>{n.title}</strong>
                <p>{n.text}</p>
                <small>{n.time}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
