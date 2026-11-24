"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, BedDouble, Car, Ruler } from "lucide-react";
import type { Property, RadarResult } from "@/lib/types";
import { formatCompactPrice, labelTipo } from "@/lib/format";
import { RADAR_LABELS, isOportunidade } from "@/lib/radar";
import { useAppStore } from "@/lib/store/useAppStore";
import clsx from "clsx";

interface PropertyCardProps {
  property: Property;
  radar?: RadarResult;
  compact?: boolean;
}

export function PropertyCard({ property, radar, compact }: PropertyCardProps) {
  const isFavorite = useAppStore((s) => s.isFavorite(property.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const oportunidade = radar ? isOportunidade(radar) : false;

  return (
    <Link
      href={`/imovel/${property.id}`}
      className="block overflow-hidden rounded-[28px] bg-surface shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
    >
      <div className={clsx("relative w-full", compact ? "h-36" : "h-44")}>
        <Image
          src={property.fotos[0]}
          alt={property.titulo}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
          unoptimized
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {oportunidade && radar && (
            <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-dark-green">
              {RADAR_LABELS[radar.classificacao]}
            </span>
          )}
          {property.demo && (
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
              Demonstrativo
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 active:scale-90 transition-transform"
        >
          <Heart
            className={clsx("h-4 w-4", isFavorite ? "fill-danger text-danger" : "text-graphite")}
          />
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-base font-extrabold">
            {formatCompactPrice(property.preco)}
            {property.finalidade === "aluguel" && (
              <span className="text-xs font-medium text-text-muted">/mês</span>
            )}
          </p>
          <span className="text-xs font-medium text-text-muted">{labelTipo(property.tipo)}</span>
        </div>
        <p className="truncate text-sm text-text-muted">
          {property.bairro}, Olinda
        </p>
        <div className="flex items-center gap-3 pt-0.5 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {property.area} m²
          </span>
          {property.quartos > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.quartos}
            </span>
          )}
          {property.vagas > 0 && (
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" /> {property.vagas}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
