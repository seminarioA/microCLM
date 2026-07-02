import { useEffect, useRef, useState } from "react";
import { searchContactNames } from "../../lib/crm";
import "./NameAutocomplete.css";

interface NameAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

/** Input de texto que sugiere nombres de contactos ya existentes mientras se escribe. */
export function NameAutocomplete({ id, value, onChange, onBlur, placeholder, className }: NameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
      const found = await searchContactNames(next);
      const filtered = found.filter((name) => name.toLowerCase() !== next.trim().toLowerCase());
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
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
          {suggestions.map((name) => (
            <button
              type="button"
              key={name}
              className="name-autocomplete__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(name);
                setSuggestions([]);
                setOpen(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
