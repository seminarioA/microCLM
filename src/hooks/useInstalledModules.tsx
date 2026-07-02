import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchInstalledModules, setModuleEnabled, type InstalledModule } from "../lib/crm";

interface InstalledModulesValue {
  modules: InstalledModule[];
  loading: boolean;
  isEnabled: (moduleKey: string) => boolean;
  toggle: (moduleKey: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const InstalledModulesContext = createContext<InstalledModulesValue | null>(null);

/**
 * Un único estado compartido para toda la app: si Marketplace desactiva un
 * módulo, el Sidebar (otro consumidor de este mismo contexto) lo refleja de
 * inmediato, sin depender de que alguien recargue la página.
 */
export function InstalledModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    await fetchInstalledModules()
      .then(setModules)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function isEnabled(moduleKey: string): boolean {
    return modules.find((m) => m.module_key === moduleKey)?.enabled ?? false;
  }

  async function toggle(moduleKey: string, enabled: boolean) {
    setModules((prev) =>
      prev.some((m) => m.module_key === moduleKey)
        ? prev.map((m) => (m.module_key === moduleKey ? { ...m, enabled } : m))
        : [...prev, { module_key: moduleKey, enabled, updated_at: new Date().toISOString() }],
    );
    await setModuleEnabled(moduleKey, enabled);
  }

  return (
    <InstalledModulesContext.Provider value={{ modules, loading, isEnabled, toggle, refresh }}>
      {children}
    </InstalledModulesContext.Provider>
  );
}

export function useInstalledModules() {
  const ctx = useContext(InstalledModulesContext);
  if (!ctx) throw new Error("useInstalledModules debe usarse dentro de InstalledModulesProvider");
  return ctx;
}
