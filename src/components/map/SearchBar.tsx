"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { OLINDA_BAIRROS } from "@/lib/data/olinda-bairros";

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface SearchBarProps {
  onSelectResult: (result: SearchResult) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

const OLINDA_VIEWBOX = "-34.92,-8.04,-34.80,-7.95"; // lonMin,latMin,lonMax,latMax aprox.

export function SearchBar({ onSelectResult, onOpenFilters, activeFilterCount }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bairroMatches: SearchResult[] = OLINDA_BAIRROS.filter((b) =>
    b.nome.toLowerCase().includes(query.trim().toLowerCase()),
  )
    .slice(0, 5)
    .map((b) => ({ label: `${b.nome}, Olinda`, lat: b.lat, lng: b.lng, zoom: 15.5 }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 4) {
      setRemoteResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${query}, Olinda, Pernambuco, Brasil`,
        )}&format=json&limit=5&viewbox=${OLINDA_VIEWBOX}&bounded=1`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        setRemoteResults(
          (data as Array<{ display_name: string; lat: string; lon: string }>).map((d) => ({
            label: d.display_name,
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            zoom: 17,
          })),
        );
      } catch {
        setRemoteResults([]);
      } finally {
        setLoading(false);
      }
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const results = [...bairroMatches, ...remoteResults];

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 shadow-[var(--shadow-float)]">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar endereço, bairro ou imóvel"
          className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpar busca">
            <X className="h-4 w-4 text-text-muted" />
          </button>
        )}
        <button
          onClick={onOpenFilters}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-[9px] font-bold text-dark-green">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {open && query.length > 0 && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 max-h-72 overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-[var(--shadow-float)]">
          {results.length === 0 && !loading && (
            <p className="px-3 py-3 text-sm text-text-muted">Nenhum resultado encontrado.</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.label}-${i}`}
              className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
              onClick={() => {
                onSelectResult(r);
                setQuery(r.label);
                setOpen(false);
              }}
            >
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="line-clamp-2">{r.label}</span>
            </button>
          ))}
          {loading && <p className="px-3 py-2 text-xs text-text-muted">Buscando…</p>}
        </div>
      )}
    </div>
  );
}
