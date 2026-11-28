"use client";

import { POI_CATEGORIES, findPOICategory } from "@/lib/data/poiCategories";
import type { POI, POICategory } from "@/lib/types";
import { haversineMeters } from "@/lib/geo";

// Mais de uma instância pública da Overpass (todas rodam o mesmo banco de dados do
// OpenStreetMap) — a instância principal (overpass-api.de) rejeita requisições vindas de IPs de
// servidor/nuvem (confirmado: o mesmo pedido falha tanto de uma função serverless da Vercel quanto
// de um ambiente de desenvolvimento em nuvem, com erro 406 direto do nginx da Overpass, antes de
// chegar no interpretador — não é um erro de sintaxe da consulta nem instabilidade pontual). Por
// isso a busca roda no navegador do usuário (IP residencial/móvel, não bloqueado), não num proxy
// no nosso servidor — ver "Pills de POI próximo" em DESIGN_SYSTEM.md.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

interface OverpassElement {
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

export interface NearbyPOIResult {
  pois: POI[];
  aviso?: string;
}

/**
 * Busca estabelecimentos reais próximos a um ponto na Overpass API (dados OpenStreetMap,
 * gratuitos e abertos) — direto do navegador do usuário (ver comentário acima sobre por que não é
 * um proxy no servidor). Respeita a política de uso da Overpass: raio limitado, timeout curto, e
 * quem chama isso (useNearbyPOIs, MapView, bairro-ideal) já cuida de não encadear chamadas.
 */
export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radius: number,
  categorias?: POICategory[],
): Promise<NearbyPOIResult> {
  const cats = categorias?.length ? categorias : POI_CATEGORIES.map((c) => c.categoria);
  const defs = cats.map(findPOICategory).filter(Boolean) as NonNullable<ReturnType<typeof findPOICategory>>[];

  if (defs.length === 0) return { pois: [] };

  const radiusClamped = Math.min(radius, 2000);

  // Agrupa os pares [chave, valor] por chave OSM (ex.: "amenity") e usa alternância via regex
  // quando há mais de um valor pra mesma chave, em vez de uma cláusula "around" por categoria.
  // Cada "around" é uma busca por proximidade cara pra Overpass computar; 8 categorias viram só
  // ~4-5 cláusulas assim, o que reduz bastante o tempo de resposta da consulta combinada (uma
  // consulta com 8 cláusulas "around" separadas chegou a não responder em mais de 40s nos testes
  // contra as instâncias públicas, enquanto a mesma busca agrupada por chave responde em segundos).
  const valuesByKey = new Map<string, string[]>();
  for (const d of defs) {
    for (const [k, v] of d.osmTags) {
      const values = valuesByKey.get(k) ?? [];
      if (!values.includes(v)) values.push(v);
      valuesByKey.set(k, values);
    }
  }
  const filters = [...valuesByKey.entries()]
    .map(([k, values]) =>
      values.length === 1
        ? `  nwr["${k}"="${values[0]}"](around:${radiusClamped},${lat},${lng});`
        : `  nwr["${k}"~"^(${values.join("|")})$"](around:${radiusClamped},${lat},${lng});`,
    )
    .join("\n");

  const query = `
    [out:json][timeout:20];
    (
${filters}
    );
    out center 60;
  `;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal: controller.signal,
      });
      if (!res.ok) continue;

      const data = await res.json();
      const elements = (data.elements ?? []) as OverpassElement[];

      const pois: POI[] = elements
        .map((el) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (elLat === undefined || elLng === undefined) return null;

          const categoria = defs.find((d) => d.osmTags.some(([k, v]) => el.tags?.[k] === v))?.categoria;
          if (!categoria) return null;

          return {
            id: `osm-${el.id}`,
            categoria,
            nome: el.tags?.name ?? findPOICategory(categoria)?.label.replace(/s$/, "") ?? "Local",
            lat: elLat,
            lng: elLng,
            distanciaMetros: Math.round(haversineMeters({ lat, lng }, { lat: elLat, lng: elLng })),
          } satisfies POI;
        })
        .filter((p): p is POI => p !== null)
        .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
        .slice(0, 60);

      return { pois };
    } catch {
      // tenta a próxima instância
    } finally {
      clearTimeout(timeout);
    }
  }

  return { pois: [], aviso: "Não foi possível carregar pontos de interesse agora." };
}
