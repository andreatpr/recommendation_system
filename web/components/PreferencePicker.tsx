"use client";

import { useEffect, useRef, useState } from "react";
import { CityInfo, PreferenceItem, getCities } from "@/lib/api";
import { clusterLabel } from "@/lib/clusterStyle";
import StarRating from "@/components/StarRating";

const MAX_SELECTIONS = 20;
const DROPDOWN_LIMIT = 8;

interface Selection {
  city: string;
  cluster: number;
  rating: number; // 0 = sin calificar (never submittable; API requires 1-5)
}

export default function PreferencePicker({
  onSubmit,
  loading,
}: {
  onSubmit: (prefs: PreferenceItem[]) => void;
  loading: boolean;
}) {
  const [catalog, setCatalog] = useState<CityInfo[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [selections, setSelections] = useState<Selection[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCities()
      .then((res) => setCatalog(res.cities))
      .catch(() => setCatalogError(true));
  }, []);

  const selectedNames = new Set(selections.map((s) => s.city));
  const matches =
    query.trim().length >= 1
      ? catalog
          .filter(
            (c) =>
              c.city.includes(query.trim().toLowerCase()) && !selectedNames.has(c.city)
          )
          .slice(0, DROPDOWN_LIMIT)
      : [];

  const atCap = selections.length >= MAX_SELECTIONS;
  const unrated = selections.some((s) => s.rating === 0);
  const canSubmit = !loading && selections.length > 0 && !unrated;

  function addCity(city: CityInfo) {
    if (atCap) return;
    setSelections((prev) => [...prev, { city: city.city, cluster: city.cluster, rating: 0 }]);
    setQuery("");
    setOpen(false);
    setHighlighted(0);
    inputRef.current?.focus();
  }

  function removeCity(name: string) {
    setSelections((prev) => prev.filter((s) => s.city !== name));
  }

  function setRating(name: string, rating: number) {
    setSelections((prev) => prev.map((s) => (s.city === name ? { ...s, rating } : s)));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      addCity(matches[Math.min(highlighted, matches.length - 1)]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Elige de 3 a 5 ciudades que conozcas y califícalas. Con eso armamos tu perfil de
        gustos y te recomendamos ciudades similares.
      </p>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={atCap}
          placeholder={atCap ? `Máximo ${MAX_SELECTIONS} ciudades` : "Busca una ciudad… (ej. west chester)"}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
          aria-label="Buscar ciudad"
          role="combobox"
          aria-expanded={open && matches.length > 0}
        />
        {open && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
            {matches.map((c, i) => (
              <li key={c.city}>
                <button
                  type="button"
                  // onMouseDown beats the input's onBlur so the click registers
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addCity(c);
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm capitalize ${
                    i === highlighted
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{c.city}</span>
                  <span className="text-xs text-zinc-400">{clusterLabel(c.cluster)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {catalogError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar el catálogo de ciudades. Verifica que la API esté disponible.
        </p>
      )}

      {selections.length > 0 && (
        <ul className="flex flex-col gap-2">
          {selections.map((s) => (
            <li
              key={s.city}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-zinc-50 px-4 py-2.5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize text-zinc-900 dark:text-zinc-50">
                  {s.city}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {clusterLabel(s.cluster)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StarRating value={s.rating} onChange={(r) => setRating(s.city, r)} />
                <button
                  type="button"
                  aria-label={`Quitar ${s.city}`}
                  onClick={() => removeCity(s.city)}
                  className="text-zinc-400 transition-colors hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit(selections.map(({ city, rating }) => ({ city, rating })))
          }
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Buscando…" : "Ver mis recomendaciones"}
        </button>
        {unrated && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Califica todas tus ciudades para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
