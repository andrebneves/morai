import { NextRequest } from "next/server";
import { POI_CATEGORIES, findPOICategory } from "@/lib/data/poiCategories";
import type { POI, POICategory } from "@/lib/types";
import { haversineMeters } from "@/lib/geo";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/**
 * Proxy para a Overpass API (dados OpenStreetMap, gratuitos e abertos).
 * Busca estabelecimentos reais próximos a um ponto, para a seção
 * "O que tem por perto" e as camadas de pontos de interesse do mapa.
 * Respeita a política de uso da Overpass: raio limitado, timeout curto,
 * sem chamadas em cadeia.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Number(searchParams.get("radius") ?? 800), 2000);
  const categoriasParam = searchParams.get("categorias");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat/lng inválidos" }, { status: 400 });
  }

  const categorias: POICategory[] = categoriasParam
    ? (categoriasParam.split(",") as POICategory[])
    : POI_CATEGORIES.map((c) => c.categoria);

  const defs = categorias.map(findPOICategory).filter(Boolean) as NonNullable<
    ReturnType<typeof findPOICategory>
  >[];

  if (defs.length === 0) {
    return Response.json({ pois: [] });
  }

  const filters = defs
    .flatMap((d) => d.osmTags.map(([k, v]) => `  nwr["${k}"="${v}"](around:${radius},${lat},${lng});`))
    .join("\n");

  const query = `
    [out:json][timeout:15];
    (
${filters}
    );
    out center 60;
  `;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return Response.json({ pois: [], aviso: "Overpass indisponível no momento." }, { status: 200 });
    }

    const data = await res.json();
    const elements = (data.elements ?? []) as Array<{
      id: number;
      tags?: Record<string, string>;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
    }>;

    const pois: POI[] = elements
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat === undefined || elLng === undefined) return null;

        const categoria = defs.find((d) =>
          d.osmTags.some(([k, v]) => el.tags?.[k] === v),
        )?.categoria;
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

    return Response.json({ pois });
  } catch {
    return Response.json(
      { pois: [], aviso: "Não foi possível carregar pontos de interesse agora." },
      { status: 200 },
    );
  }
}
