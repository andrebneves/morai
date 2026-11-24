"use client";

import { useMemo, useState } from "react";
import { useNearbyPOIs } from "@/lib/hooks/useNearbyPOIs";
import { POI_ICONS } from "@/lib/data/poiIcons";
import { POI_CATEGORIES } from "@/lib/data/poiCategories";
import { formatDistance } from "@/lib/geo";
import { Chip } from "@/components/ui/Chip";
import { Loader2 } from "lucide-react";
import type { POICategory } from "@/lib/types";

const DESTAQUE: POICategory[] = [
  "farmacia",
  "supermercado",
  "escola",
  "restaurante",
  "ponto_onibus",
  "praia",
  "academia",
  "banco",
];

export function NearbyPOISection({ lat, lng }: { lat: number; lng: number }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<POICategory | null>(null);
  const { pois, loading, aviso } = useNearbyPOIs(lat, lng, 900, DESTAQUE);

  const visiveis = useMemo(
    () => (categoriaAtiva ? pois.filter((p) => p.categoria === categoriaAtiva) : pois).slice(0, 12),
    [pois, categoriaAtiva],
  );

  const categoriasComResultado = useMemo(
    () => DESTAQUE.filter((cat) => pois.some((p) => p.categoria === cat)),
    [pois],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">O que tem por perto</h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
      </div>
      <p className="text-xs text-text-muted">
        Distâncias em linha reta a partir do imóvel, com dados abertos do OpenStreetMap.
      </p>

      {categoriasComResultado.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Chip active={categoriaAtiva === null} onClick={() => setCategoriaAtiva(null)}>
            Todos
          </Chip>
          {categoriasComResultado.map((cat) => {
            const def = POI_CATEGORIES.find((c) => c.categoria === cat)!;
            return (
              <Chip key={cat} active={categoriaAtiva === cat} onClick={() => setCategoriaAtiva(cat)}>
                {def.label}
              </Chip>
            );
          })}
        </div>
      )}

      {!loading && pois.length === 0 && !aviso && (
        <p className="text-sm text-text-muted">Nenhum ponto de interesse encontrado nas proximidades.</p>
      )}
      {aviso && <p className="text-sm text-warning">{aviso}</p>}

      <div className="space-y-1.5">
        {visiveis.map((poi) => {
          const Icon = POI_ICONS[poi.categoria];
          return (
            <div key={poi.id} className="flex items-center gap-3 rounded-xl border border-border-subtle px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                <Icon className="h-4 w-4 text-emerald" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{poi.nome}</span>
              <span className="shrink-0 text-xs font-semibold text-text-muted">
                {formatDistance(poi.distanciaMetros)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
