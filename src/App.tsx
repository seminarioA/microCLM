import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { KanbanBoard } from "./modules/kanban/KanbanBoard";
import { LeadForm } from "./modules/leads/LeadForm";
import { OsintProspecting } from "./modules/osint/OsintProspecting";
import { OrgChart } from "./modules/orgchart/OrgChart";
import { Dashboard } from "./modules/dashboard/Dashboard";
import { ClientProfile } from "./modules/profile/ClientProfile";
import { MyProfile } from "./modules/account/MyProfile";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./auth/Login";
import { fetchLeadIdForContact } from "./lib/crm";
import "./App.css";

export type ModuleId = "kanban" | "form" | "osint" | "orgchart" | "dashboard" | "profiles" | "myProfile";

function App() {
  const [active, setActive] = useState<ModuleId>("kanban");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { session, loading } = useAuth();

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
          {active === "myProfile" && <MyProfile />}
        </div>
      </main>
    </div>
  );
}

export default App;
