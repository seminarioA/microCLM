import { useEffect, useState } from "react";
import { fetchSectors, type Sector } from "../lib/crm";

/** Rubros (sectores) tal como existen hoy en la base de datos: no es una lista fija. */
export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectors()
      .then(setSectors)
      .finally(() => setLoading(false));
  }, []);

  function labelOf(key: string | null | undefined): string {
    if (!key) return "Sin rubro";
    return sectors.find((s) => s.key === key)?.label ?? key;
  }

  function addSector(sector: Sector) {
    setSectors((prev) => (prev.some((s) => s.key === sector.key) ? prev : [...prev, sector].sort((a, b) => a.label.localeCompare(b.label))));
  }

  return { sectors, loading, labelOf, addSector };
}
