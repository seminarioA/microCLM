import { useCallback, useEffect, useState } from "react";
import { fetchInstalledModules, setModuleEnabled, type InstalledModule } from "../lib/crm";

/** Qué módulos opcionales (instalados desde el Marketplace) están habilitados para todo el equipo. */
export function useInstalledModules() {
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return fetchInstalledModules()
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

  return { modules, loading, isEnabled, toggle, refresh };
}
