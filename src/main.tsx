import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./theme/ThemeContext.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { InstalledModulesProvider } from "./hooks/useInstalledModules.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <InstalledModulesProvider>
          <App />
        </InstalledModulesProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
