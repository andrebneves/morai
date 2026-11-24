"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Scale } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PropertyCard } from "@/components/property/PropertyCard";
import { getAllProperties } from "@/lib/data/properties";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import type { Property } from "@/lib/types";

export default function FavoritosPage() {
  const [all, setAll] = useState<Property[]>([]);
  const favorites = useAppStore((s) => s.favorites);
  const compareList = useAppStore((s) => s.compareList);
  const radarById = useRadarMap(all);

  useEffect(() => {
    getAllProperties().then(setAll);
  }, []);

  const favoritos = all.filter((p) => favorites.includes(p.id));

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="space-y-4 px-5 pt-safe">
        <h1 className="text-xl font-extrabold">Favoritos</h1>

        {compareList.length > 0 && (
          <Link
            href="/comparar"
            className="flex items-center justify-between rounded-2xl bg-dark-green px-4 py-3 text-off-white"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Scale className="h-4 w-4 text-emerald" />
              Comparar {compareList.length} imóve{compareList.length > 1 ? "is" : "l"}
            </span>
            <span className="text-xs font-bold text-emerald">Ver</span>
          </Link>
        )}

        {favoritos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Heart className="h-10 w-10 text-text-muted" />
            <p className="font-semibold">Nenhum favorito ainda</p>
            <p className="max-w-xs text-sm text-text-muted">
              Toque no coração de um imóvel no mapa ou na lista para salvá-lo aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favoritos.map((p) => (
              <PropertyCard key={p.id} property={p} radar={radarById[p.id]} compact />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
