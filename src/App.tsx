import { useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { KanbanBoard } from "./modules/kanban/KanbanBoard";
import { LeadForm } from "./modules/leads/LeadForm";
import { OsintProspecting } from "./modules/osint/OsintProspecting";
import { OrgChart } from "./modules/orgchart/OrgChart";
import { Dashboard } from "./modules/dashboard/Dashboard";
import { ClientProfile } from "./modules/profile/ClientProfile";
import { MyProfile } from "./modules/account/MyProfile";
import { Settings } from "./modules/settings/Settings";
import { Marketplace } from "./modules/marketplace/Marketplace";
import { Catalog } from "./modules/catalog/Catalog";
import { SyntheticLead } from "./modules/syntheticLead/SyntheticLead";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./auth/Login";
import { fetchLeadIdForContact, fetchTenantSettings } from "./lib/crm";
import { applyTenantColors } from "./theme/brand";
import "./App.css";

export type ModuleId =
  | "kanban"
  | "form"
  | "osint"
  | "orgchart"
  | "dashboard"
  | "profiles"
  | "catalog"
  | "syntheticLead"
  | "myProfile"
  | "settings"
  | "marketplace";

function App() {
  const [active, setActive] = useState<ModuleId>("kanban");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!session) return;
    fetchTenantSettings()
      .then(applyTenantColors)
      .catch(() => {});
  }, [session]);

  if (loading) return null;
  if (!session) return <Login />;

  function handleSelectLead(leadId: string) {
    setSelectedLeadId(leadId);
    setActive("profiles");
  }

  async function handleSelectContact(contactId: string) {
    const leadId = await fetchLeadIdForContact(contactId);
    if (leadId) {
      handleSelectLead(leadId);
    } else {
      setSelectedLeadId(null);
      setActive("profiles");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onSelect={setActive} />
      <main className="app-main">
        <TopBar onSelectLead={handleSelectLead} />
        <div className="app-module" key={active}>
          {active === "kanban" && <KanbanBoard />}
          {active === "form" && <LeadForm />}
          {active === "osint" && <OsintProspecting />}
          {active === "orgchart" && <OrgChart onSelectContact={handleSelectContact} />}
          {active === "dashboard" && <Dashboard />}
          {active === "profiles" && <ClientProfile leadId={selectedLeadId ?? undefined} />}
          {active === "catalog" && <Catalog />}
          {active === "syntheticLead" && <SyntheticLead leadId={selectedLeadId ?? undefined} />}
          {active === "myProfile" && <MyProfile />}
          {active === "settings" && <Settings />}
          {active === "marketplace" && <Marketplace />}
        </div>
      </main>
    </div>
  );
}

export default App;
