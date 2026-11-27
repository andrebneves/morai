"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { OLINDA_BAIRROS } from "@/lib/data/olinda-bairros";
import type { ListingPurpose } from "@/lib/types";

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface SearchBarProps {
  onSelectResult: (result: SearchResult) => void;
  /** Tinge o ícone de busca e o contorno com a mesma cor do modo ativo (Comprar/Alugar),
   * pra dar pra saber de relance em qual modo você está. */
  purpose: ListingPurpose;
}

const OLINDA_VIEWBOX = "-34.92,-8.04,-34.80,-7.95"; // lonMin,latMin,lonMax,latMax aprox.

// O botão de filtros saiu da barra de busca e virou um botão circular flutuante na lateral
// direita do mapa, junto com camadas/centralizar — organização pedida no briefing de direção
// de arte ("organize os botões preferencialmente na lateral direita").
export function SearchBar({ onSelectResult, purpose }: SearchBarProps) {
  const isAluguel = purpose === "aluguel";
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
      <div
        className={clsx(
          "flex items-center gap-2.5 rounded-full bg-surface py-2 pl-2 pr-2.5 shadow-[var(--shadow-float)] ring-2 transition-colors",
          isAluguel ? "ring-lime/60" : "ring-emerald/60",
        )}
      >
        <span
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isAluguel ? "bg-lime" : "bg-emerald",
          )}
        >
          <Search className="h-4 w-4 text-dark-green" strokeWidth={2.6} />
        </span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar endereço, bairro ou imóvel"
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-text-muted placeholder:font-normal"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpar busca">
            <X className="h-4 w-4 text-text-muted" />
          </button>
        )}
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
