"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";
import { getAllProperties } from "@/lib/data/properties";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import { formatBRL, labelTipo } from "@/lib/format";
import { RADAR_LABELS } from "@/lib/radar";
import type { Property } from "@/lib/types";

export default function CompararPage() {
  const router = useRouter();
  const [all, setAll] = useState<Property[]>([]);
  const compareList = useAppStore((s) => s.compareList);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const radarById = useRadarMap(all);

  useEffect(() => {
    getAllProperties().then(setAll);
  }, []);

  const itens = compareList.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Property[];

  const rows: { label: string; render: (p: Property) => React.ReactNode }[] = [
    { label: "Preço", render: (p) => formatBRL(p.preco) + (p.finalidade === "aluguel" ? "/mês" : "") },
    { label: "Área", render: (p) => `${p.area} m²` },
    { label: "Preço/m²", render: (p) => formatBRL(p.precoM2) },
    { label: "Quartos", render: (p) => String(p.quartos) },
    { label: "Vagas", render: (p) => String(p.vagas) },
    { label: "Condomínio", render: (p) => formatBRL(p.condominio) },
    { label: "IPTU mensal", render: (p) => formatBRL(p.iptuMensal) },
    {
      label: "Moraí Radar",
      render: (p) => {
        const r = radarById[p.id];
        return r ? RADAR_LABELS[r.classificacao] : "—";
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="flex items-center gap-3 px-5 pt-safe pb-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Comparar imóveis</h1>
      </div>

      {itens.length === 0 ? (
        <p className="px-5 text-sm text-text-muted">Nenhum imóvel selecionado para comparação.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-3 px-5" style={{ minWidth: itens.length * 160 }}>
            {itens.map((p) => (
              <div key={p.id} className="w-40 shrink-0 space-y-2">
                <div className="relative h-28 w-40 overflow-hidden rounded-xl">
                  <Image src={p.fotos[0]} alt={p.titulo} fill className="object-cover" unoptimized />
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="truncate text-xs font-semibold">{p.titulo}</p>
                <p className="text-[11px] text-text-muted">{labelTipo(p.tipo)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-0 px-5">
            {rows.map((row) => (
              <div key={row.label} className="flex border-t border-border-subtle py-2.5 text-sm">
                <span className="w-24 shrink-0 text-text-muted">{row.label}</span>
                <div className="flex flex-1 gap-3">
                  {itens.map((p) => (
                    <span key={p.id} className="w-40 shrink-0 font-semibold">
                      {row.render(p)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
