"use client";

import { useEffect, useState } from "react";
import type { POI, POICategory } from "@/lib/types";

export function useNearbyPOIs(
  lat: number,
  lng: number,
  radius = 800,
  categorias?: POICategory[],
) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
    if (categorias?.length) params.set("categorias", categorias.join(","));

    fetch(`/api/poi?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPois(data.pois ?? []);
        setAviso(data.aviso ?? null);
      })
      .catch(() => {
        if (!cancelled) setAviso("Não foi possível carregar pontos de interesse agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radius, categorias?.join(",")]);

  return { pois, loading, aviso };
}
