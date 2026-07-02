import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Plus, Tag, UserPlus, Users } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { NameAutocomplete } from "../../components/shared/NameAutocomplete";
import { mailtoLink, whatsappLink } from "../../lib/contactLinks";
import {
  addOrgChartContact,
  fetchCompaniesForOrgChart,
  fetchOrgChart,
  type OrgChartCompany,
  type OrgChartContact,
} from "../../lib/crm";
import "./OrgChart.css";

interface TreeNode extends OrgChartContact {
  children: TreeNode[];
}

function buildTree(contacts: OrgChartContact[]): TreeNode[] {
  const nodes = new Map<string, TreeNode>(contacts.map((c) => [c.id, { ...c, children: [] }]));
  const roots: TreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.reports_to && nodes.has(node.reports_to)) {
      nodes.get(node.reports_to)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function OrgNode({ node, onSelectContact }: { node: TreeNode; onSelectContact: (contactId: string) => void }) {
  return (
    <div className="orgnode">
      <div
        className="orgnode__card"
        role="button"
        tabIndex={0}
        onClick={() => onSelectContact(node.id)}
        onKeyDown={(e) => e.key === "Enter" && onSelectContact(node.id)}
        title="Ver perfil en Perfiles"
      >
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(node.full_name)}&background=1c1b17&color=F5F3E8&size=64`}
          alt={node.full_name}
        />
        <div className="orgnode__info">
          <strong>{node.full_name}</strong>
          <span>{node.role_title ?? "Sin cargo"}</span>
          {node.contact_reason && (
            <span className="orgnode__reason">
              <Tag size={11} strokeWidth={2} /> {node.contact_reason}
            </span>
          )}
          <div className="orgnode__contact">
            {node.email && (
              <a href={mailtoLink(node.email)} onClick={(e) => e.stopPropagation()}>
                <Mail size={11} strokeWidth={2} /> {node.email}
              </a>
            )}
            {node.phone && (
              <a
                href={whatsappLink(node.phone)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={11} strokeWidth={2} /> {node.phone}
              </a>
            )}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="orgnode__children">
          {node.children.map((child) => (
            <div className="orgnode__child" key={child.id}>
              <OrgNode node={child} onSelectContact={onSelectContact} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OrgChartProps {
  onSelectContact: (contactId: string) => void;
}

export function OrgChart({ onSelectContact }: OrgChartProps) {
  const [companies, setCompanies] = useState<OrgChartCompany[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [contacts, setContacts] = useState<OrgChartContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [contactReason, setContactReason] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompaniesForOrgChart().then(setCompanies);
  }, []);

  useEffect(() => {
    if (!companyId) {
      setContacts([]);
      return;
    }
    setLoading(true);
    fetchOrgChart(companyId)
      .then(setContacts)
      .finally(() => setLoading(false));
  }, [companyId]);

  const tree = useMemo(() => buildTree(contacts), [contacts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !companyId) return;
    setSaving(true);
    try {
      await addOrgChartContact({
        companyId,
        fullName,
        roleTitle,
        contactReason,
        email,
        phone,
        reportsTo: reportsTo || null,
      });
      setContacts(await fetchOrgChart(companyId));
      setShowForm(false);
      setFullName("");
      setRoleTitle("");
      setContactReason("");
      setEmail("");
      setPhone("");
      setReportsTo("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <ModuleHeader
        title="Organigrama"
        subtitle="Mapa de contactos por empresa: quién es quién y por qué contactarlo"
      />

      <div className="orgchart-toolbar panel">
        <div className="osint-search__field">
          <label htmlFor="orgchart-company">
            <Users size={13} strokeWidth={2} /> Empresa
          </label>
          <select id="orgchart-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">Selecciona una empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {companyId && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <UserPlus size={14} strokeWidth={2} /> Agregar contacto
          </button>
        )}
      </div>

      {showForm && companyId && (
        <form className="orgchart-form panel" onSubmit={handleAdd}>
          <div className="orgchart-form__grid">
            <div className="form-group">
              <label htmlFor="org-name">Nombre completo</label>
              <NameAutocomplete id="org-name" value={fullName} onChange={setFullName} placeholder="Nombre y apellido" />
            </div>
            <div className="form-group">
              <label htmlFor="org-role">Cargo</label>
              <input id="org-role" type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="org-reason">Motivo de contacto</label>
              <input
                id="org-reason"
                type="text"
                placeholder="Ej. Decisor de compra, soporte técnico..."
                value={contactReason}
                onChange={(e) => setContactReason(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="org-email">Correo</label>
              <input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="org-phone">Teléfono</label>
              <input id="org-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="org-reports">Reporta a</label>
              <select id="org-reports" value={reportsTo} onChange={(e) => setReportsTo(e.target.value)}>
                <option value="">Nivel superior (nadie)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Plus size={13} strokeWidth={2} /> {saving ? "Guardando..." : "Agregar al organigrama"}
          </button>
        </form>
      )}

      {!companyId && <p className="osint-empty">Selecciona una empresa para ver o construir su organigrama.</p>}
      {companyId && loading && <p className="osint-empty">Cargando organigrama...</p>}
      {companyId && !loading && contacts.length === 0 && (
        <p className="osint-empty">Esta empresa aún no tiene contactos registrados. Agrega el primero.</p>
      )}

      {companyId && !loading && tree.length > 0 && (
        <div className="orgchart-tree">
          {tree.map((node) => (
            <OrgNode key={node.id} node={node} onSelectContact={onSelectContact} />
          ))}
        </div>
      )}
    </section>
  );
}
