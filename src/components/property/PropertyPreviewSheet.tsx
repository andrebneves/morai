"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Scale, BedDouble, Bath, Car, Ruler, ChevronRight, Navigation } from "lucide-react";
import type { Property, RadarResult } from "@/lib/types";
import { formatCompactPrice, labelTipo } from "@/lib/format";
import { RADAR_LABELS, RADAR_AVISO, isOportunidade } from "@/lib/radar";
import { useAppStore } from "@/lib/store/useAppStore";
import clsx from "clsx";

interface PropertyPreviewSheetProps {
  property: Property;
  radar?: RadarResult;
  /** Guia até o imóvel usando o GPS do próprio Moraí (Modo Passeio), em vez de abrir um app
   * de navegação externo — o app "é o GPS", não um atalho pra outros apps. */
  onDirigir: (property: Property) => void;
}

export function PropertyPreviewSheet({ property, radar, onDirigir }: PropertyPreviewSheetProps) {
  const isFavorite = useAppStore((s) => s.isFavorite(property.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const compareList = useAppStore((s) => s.compareList);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const inCompare = compareList.includes(property.id);
  const oportunidade = radar ? isOportunidade(radar) : false;

  return (
    <div className="px-4 pb-4">
      <Link href={`/imovel/${property.id}`} className="flex gap-3">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
          <Image src={property.fotos[0]} alt={property.titulo} fill className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {oportunidade && radar && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-dark-green">
              ★ {RADAR_LABELS[radar.classificacao]}
            </span>
          )}
          <p className="truncate font-semibold">{property.titulo}</p>
          <p className="text-lg font-extrabold">
            {formatCompactPrice(property.preco)}
            {property.finalidade === "aluguel" && <span className="text-xs font-medium"> /mês</span>}
          </p>
          <p className="truncate text-xs text-text-muted">
            {labelTipo(property.tipo)} · {property.area} m² · {property.bairro}
          </p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-text-muted" />
      </Link>

      <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
        {property.quartos > 0 && (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {property.quartos}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Bath className="h-3.5 w-3.5" /> {property.banheiros}
        </span>
        {property.vagas > 0 && (
          <span className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" /> {property.vagas}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Ruler className="h-3.5 w-3.5" /> {property.area} m²
        </span>
      </div>

      {radar && radar.classificacao !== "insuficiente" && (
        <p className="mt-2 text-[11px] text-text-muted">{RADAR_AVISO}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => toggleFavorite(property.id)}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold",
            isFavorite ? "border-danger text-danger" : "border-border-subtle",
          )}
        >
          <Heart className={clsx("h-4 w-4", isFavorite && "fill-danger")} />
          {isFavorite ? "Salvo" : "Salvar"}
        </button>
        <button
          onClick={() => toggleCompare(property.id)}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold",
            inCompare ? "border-emerald text-emerald" : "border-border-subtle",
          )}
        >
          <Scale className="h-4 w-4" />
          Comparar
        </button>
      </div>

      <button
        onClick={() => onDirigir(property)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-emerald/35 bg-dark-green py-2.5 text-sm font-bold text-off-white"
      >
        <Navigation className="h-4 w-4" />
        Dirigir até lá
      </button>
    </div>
  );
}
