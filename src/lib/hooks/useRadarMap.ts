import { useMemo } from "react";
import type { Property, RadarResult } from "@/lib/types";
import { calcularRadar } from "@/lib/radar";

export function useRadarMap(properties: Property[]): Record<string, RadarResult> {
  return useMemo(() => {
    const map: Record<string, RadarResult> = {};
    for (const p of properties) {
      map[p.id] = calcularRadar(p, properties);
    }
    return map;
  }, [properties]);
}
