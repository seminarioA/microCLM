import { useEffect, useRef, useState } from "react";
import { searchCompanies, type CompanySuggestion } from "../../lib/crm";
import "./NameAutocomplete.css";

interface CompanyAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelectCompany: (company: CompanySuggestion) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Input que sugiere empresas ya existentes mientras se escribe. Elegir una
 * sugerencia vincula al id real de esa empresa, para que variantes de
 * escritura ("UTP", "uTP", "Universidad Tecnológica del Perú") apunten
 * siempre a la misma entidad en vez de crear registros duplicados.
 */
export function CompanyAutocomplete({
  id,
  value,
  onChange,
  onSelectCompany,
  onBlur,
  placeholder,
  className,
}: CompanyAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function handleChange(next: string) {
    onChange(next);
    window.clearTimeout(debounceRef.current);

    if (next.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const found = await searchCompanies(next);
      setSuggestions(found);
      setOpen(found.length > 0);
    }, 250);
  }

  return (
    <div className="name-autocomplete" ref={ref}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        className={className}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={onBlur}
      />
      {open && (
        <div className="name-autocomplete__dropdown">
          {suggestions.map((company) => (
            <button
              type="button"
              key={company.id}
              className="name-autocomplete__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(company.name);
                onSelectCompany(company);
                setSuggestions([]);
                setOpen(false);
              }}
            >
              {company.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
