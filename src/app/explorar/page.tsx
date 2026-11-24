"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Compass } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Chip } from "@/components/ui/Chip";
import { PurposeToggle } from "@/components/map/PurposeToggle";
import { getAllProperties } from "@/lib/data/properties";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import { isOportunidade } from "@/lib/radar";
import { useAppStore } from "@/lib/store/useAppStore";
import { OLINDA_BAIRROS } from "@/lib/data/olinda-bairros";
import type { Property } from "@/lib/types";

export default function ExplorarPage() {
  const [all, setAll] = useState<Property[]>([]);
  const [bairro, setBairro] = useState<string | null>(null);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const radarById = useRadarMap(all);

  useEffect(() => {
    getAllProperties().then(setAll);
  }, []);

  const porFinalidade = all.filter((p) => p.finalidade === filters.finalidade);
  const oportunidades = porFinalidade.filter((p) => isOportunidade(radarById[p.id]));
  const listados = useMemo(
    () => (bairro ? porFinalidade.filter((p) => p.bairro === bairro) : porFinalidade),
    [porFinalidade, bairro],
  );

  const bairrosComImoveis = OLINDA_BAIRROS.filter((b) => porFinalidade.some((p) => p.bairro === b.nome));

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="space-y-5 px-5 pt-safe">
        <h1 className="text-xl font-extrabold">Explorar Olinda</h1>
        <PurposeToggle value={filters.finalidade} onChange={(v) => setFilters({ finalidade: v })} />

        <Link
          href="/bairro-ideal"
          className="flex items-center justify-between rounded-2xl bg-dark-green px-4 py-3.5 text-off-white"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Compass className="h-4 w-4 text-emerald" />
            Descubra seu bairro ideal em Olinda
          </span>
          <span className="text-xs font-bold text-emerald">Começar</span>
        </Link>

        {oportunidades.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-lime" />
              <h2 className="text-base font-bold">Oportunidades do Moraí Radar</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {oportunidades.slice(0, 10).map((p) => (
                <div key={p.id} className="w-44 shrink-0">
                  <PropertyCard property={p} radar={radarById[p.id]} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-base font-bold">Bairros</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <Chip active={bairro === null} onClick={() => setBairro(null)}>
              Todos
            </Chip>
            {bairrosComImoveis.map((b) => (
              <Chip key={b.nome} active={bairro === b.nome} onClick={() => setBairro(b.nome)}>
                {b.nome}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">{listados.length} imóveis encontrados</h2>
          <div className="grid grid-cols-2 gap-3">
            {listados.map((p) => (
              <PropertyCard key={p.id} property={p} radar={radarById[p.id]} compact />
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
