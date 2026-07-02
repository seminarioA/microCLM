import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { KanbanBoard } from "./modules/kanban/KanbanBoard";
import { LeadForm } from "./modules/leads/LeadForm";
import { Dashboard } from "./modules/dashboard/Dashboard";
import { ClientProfile } from "./modules/profile/ClientProfile";
import "./App.css";

export type ModuleId = "kanban" | "form" | "dashboard" | "profile";

function App() {
  const [active, setActive] = useState<ModuleId>("kanban");

  return (
    <div className="app-shell">
      <Sidebar active={active} onSelect={setActive} />
      <main className="app-main">
        {active === "kanban" && <KanbanBoard />}
        {active === "form" && <LeadForm />}
        {active === "dashboard" && <Dashboard />}
        {active === "profile" && <ClientProfile />}
      </main>
    </div>
  );
}

export default App;
