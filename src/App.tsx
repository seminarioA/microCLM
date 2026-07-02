import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { KanbanBoard } from "./modules/kanban/KanbanBoard";
import { LeadForm } from "./modules/leads/LeadForm";
import { OsintProspecting } from "./modules/osint/OsintProspecting";
import { Dashboard } from "./modules/dashboard/Dashboard";
import { ClientProfile } from "./modules/profile/ClientProfile";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./auth/Login";
import "./App.css";

export type ModuleId = "kanban" | "form" | "osint" | "dashboard" | "profile";

function App() {
  const [active, setActive] = useState<ModuleId>("kanban");
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Login />;

  return (
    <div className="app-shell">
      <Sidebar active={active} onSelect={setActive} />
      <main className="app-main">
        {active === "kanban" && <KanbanBoard />}
        {active === "form" && <LeadForm />}
        {active === "osint" && <OsintProspecting />}
        {active === "dashboard" && <Dashboard />}
        {active === "profile" && <ClientProfile />}
      </main>
    </div>
  );
}

export default App;
