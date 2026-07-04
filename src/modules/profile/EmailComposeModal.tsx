import { useState } from "react";
import { Mail, Send, X } from "lucide-react";
import { sendEmail } from "../../lib/crm";
import "./EmailComposeModal.css";

interface EmailComposeModalProps {
  to: string;
  leadId?: string;
  contactId?: string;
  onClose: () => void;
  onSent: () => void;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function EmailComposeModal({ to, leadId, contactId, onClose, onSent }: EmailComposeModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError("Asunto y mensaje son obligatorios");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const bodyHtml = `<p>${escapeHtml(body).replace(/\n/g, "<br />")}</p>`;
      await sendEmail({ leadId, contactId, to, subject: subject.trim(), bodyHtml });
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card panel email-compose" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-card__header">
          <h3>
            <Mail size={15} strokeWidth={2} /> Redactar correo
          </h3>
          <button type="button" className="modal-card__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="email-to">Para</label>
          <input id="email-to" type="email" value={to} disabled />
        </div>

        <div className="form-group">
          <label htmlFor="email-subject">Asunto</label>
          <input
            id="email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-body">Mensaje</label>
          <textarea
            id="email-body"
            className="email-compose__body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe tu mensaje..."
          />
        </div>

        {error && <span className="field-error">{error}</span>}

        <div className="modal-card__actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            <Send size={13} strokeWidth={2} /> {sending ? "Enviando..." : "Enviar correo"}
          </button>
        </div>
      </form>
    </div>
  );
}
