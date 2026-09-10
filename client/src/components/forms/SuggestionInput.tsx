import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SuggestionInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  fetchSuggestions: (search: string) => Promise<string[]>;
  error?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
}

/**
 * SuggestionInput - text input with autocomplete suggestions dropdown.
 * Debounced fetch; clicking a suggestion fills the input.
 */
export function SuggestionInput({
  label,
  placeholder,
  value,
  onValueChange,
  fetchSuggestions,
  error,
  required,
  type = "text",
  maxLength,
}: SuggestionInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep a stable ref to fetchSuggestions so the effect doesn't loop
  const fetchRef = useRef(fetchSuggestions);
  useEffect(() => {
    fetchRef.current = fetchSuggestions;
  }, [fetchSuggestions]);

  useEffect(() => {
    const v = (value || "").trim();
    if (v.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await fetchRef.current(v);

        // Dedupe case-insensitively, exclude exact same as input value
        const seen = new Set<string>();
        const filtered = items.filter((s) => {
          const k = s.toLowerCase();
          if (seen.has(k)) return false;
          if (s === value) return false;
          seen.add(k);
          return true;
        });

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          maxLength={maxLength}
          required={required}
          className={`w-full rounded-xl border bg-background/50 px-4 py-2.5 pr-10 focus:ring-2 focus:ring-primary/30 outline-none ${
            error ? "border-danger" : "border-border"
          }`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-card shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                onValueChange(s);
                setShowSuggestions(false);
              }}
              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export default SuggestionInput;