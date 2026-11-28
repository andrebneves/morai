"use client";

import { useEffect, useState } from "react";
import type { POI, POICategory } from "@/lib/types";
import { fetchNearbyPOIs } from "@/lib/overpass";

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

    fetchNearbyPOIs(lat, lng, radius, categorias)
      .then((data) => {
        if (cancelled) return;
        setPois(data.pois);
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
