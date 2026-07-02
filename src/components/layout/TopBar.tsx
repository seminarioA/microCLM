import { useEffect, useRef, useState } from "react";
import { Moon, Search, Sun, UserSearch } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { searchLeads, type LeadSearchResult } from "../../lib/crm";
import "./TopBar.css";

interface TopBarProps {
  onSelectLead: (leadId: string) => void;
}

export function TopBar({ onSelectLead }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    window.clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchLeads(value);
        setResults(found);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(leadId: string) {
    onSelectLead(leadId);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="topbar">
      <div className="topbar__search" ref={ref}>
        <Search size={14} strokeWidth={2} />
        <input
          type="text"
          placeholder="Buscar leads, contactos o empresas..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {open && (
          <div className="topbar__dropdown">
            {loading && <div className="topbar__dropdown-empty">Buscando...</div>}
            {!loading && results.length === 0 && (
              <div className="topbar__dropdown-empty">Sin resultados para "{query}"</div>
            )}
            {!loading &&
              results.map((r) => (
                <button
                  type="button"
                  key={r.leadId}
                  className="topbar__dropdown-item"
                  onClick={() => handleSelect(r.leadId)}
                >
                  <UserSearch size={13} strokeWidth={2} />
                  <div>
                    <strong>{r.contactName}</strong>
                    <span>{r.companyName}</span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="topbar__theme-toggle"
        onClick={toggleTheme}
        title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      >
        {theme === "light" ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
