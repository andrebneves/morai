"use client";

import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";
import { Church, Landmark, Binoculars, Castle } from "lucide-react";
import type { POI, POICategory, Property, RadarResult } from "@/lib/types";
import { formatCompactPrice } from "@/lib/format";
import { isOportunidade } from "@/lib/radar";
import { OLINDA_CENTER, OLINDA_BAIRROS } from "@/lib/data/olinda-bairros";
import { OLINDA_MARCOS, type MarcoIcone } from "@/lib/data/olinda-marcos";
import { STREETS_STYLE, SATELLITE_STYLE } from "@/components/map/mapStyles";
import { haversineMeters, formatDistance } from "@/lib/geo";
import { POI_ICONS } from "@/lib/data/poiIcons";
import { fetchNearbyPOIs } from "@/lib/overpass";

const MARCO_ICONS: Record<MarcoIcone, typeof Church> = {
  igreja: Church,
  mirante: Binoculars,
  mosteiro: Landmark,
  forte: Castle,
};

const marcoIconSvgCache = new Map<MarcoIcone, string>();
function getMarcoIconSvg(icone: MarcoIcone): string {
  const cached = marcoIconSvgCache.get(icone);
  if (cached) return cached;
  const svg = renderToStaticMarkup(createElement(MARCO_ICONS[icone], { size: 14, strokeWidth: 2.2, color: "#2E4A2A" }));
  marcoIconSvgCache.set(icone, svg);
  return svg;
}

/** Mesmas categorias já destacadas em "O que tem por perto" (NearbyPOISection) — reaproveita a
 * mesma curadoria em vez de inventar outra lista, pra consistência entre mapa e detalhe do imóvel. */
const MAP_POI_CATEGORIES: POICategory[] = [
  "farmacia",
  "supermercado",
  "escola",
  "restaurante",
  "ponto_onibus",
  "praia",
  "academia",
  "banco",
];

/** Pré-renderiza cada ícone (mesmo lucide-react usado em NearbyPOISection) pra SVG estático, sob
 * demanda e com cache — os marcadores deste arquivo usam innerHTML bruto, não JSX, por
 * performance (ver marcadores de imóvel/cluster abaixo), então não dá pra montar os ícones via
 * React aqui. Lazy (não no topo do módulo): `renderToStaticMarkup` só pode rodar depois que o
 * React já está montado — calculado no topo do módulo, quebra o prerender estático do Next.js. */
const poiIconSvgCache = new Map<POICategory, string>();
function getPoiIconSvg(categoria: POICategory): string {
  const cached = poiIconSvgCache.get(categoria);
  if (cached) return cached;
  const svg = renderToStaticMarkup(createElement(POI_ICONS[categoria], { size: 13, strokeWidth: 2.4 }));
  poiIconSvgCache.set(categoria, svg);
  return svg;
}

/** Só busca POIs próximos de novo quando o usuário se afasta mais que isso do último ponto
 * consultado — evita martelar a Overpass API (gratuita, de uso justo) a cada atualização de GPS. */
const POI_REFETCH_DISTANCE_METERS = 150;
const POI_SEARCH_RADIUS_METERS = 500;
/** No máximo essa quantidade de pills simultâneas no mapa — mais que isso polui a tela (ver
 * referência visual do briefing "Moraí Maps"). */
const MAX_POI_PILLS = 4;

// O auto-bundling do worker do MapLibre não resolve sob o Turbopack dev-server;
// usamos o bundle oficial copiado para /public (ver scripts/copy-maplibre-worker.mjs).
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  getMap: () => MapLibreMap | null;
  /** Retoma o acompanhamento automático da posição/direção (ex.: botão "Recentralizar"). */
  resumeFollow: () => void;
}

interface MapViewProps {
  properties: Property[];
  radarById?: Record<string, RadarResult>;
  selectedId?: string | null;
  onSelectProperty: (id: string) => void;
  userPosition?: { lat: number; lng: number; heading?: number | null } | null;
  satellite?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  /**
   * Modo "GPS tipo Waze": a câmera acompanha a posição e gira para manter a direção de
   * deslocamento sempre "pra cima" na tela, em vez do norte fixo. Pausa automaticamente se o
   * usuário arrastar o mapa manualmente (ver `onFollowPausedChange`/`resumeFollow`).
   */
  followHeading?: boolean;
  onFollowPausedChange?: (paused: boolean) => void;
  /** Linha da rota real (pelas ruas) até o imóvel escolhido no Modo Passeio, já em [lng, lat]. */
  routeCoordinates?: [number, number][] | null;
}

const ROUTE_SOURCE_ID = "morai-route";

interface PointProps {
  propertyId: string;
}

interface ClusterProps {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number | string;
}

type ClusterFeature = Feature<Point, PointProps | ClusterProps>;

/** Inclinação da câmera: mais alta no modo de exploração livre (mapa "parado"), pra revelar
 * os prédios extrudados e dar a sensação de maquete/diorama tipo The Sims; mais baixa durante
 * o Modo Passeio (GPS seguindo a direção), pra manter a leitura clara andando/dirigindo sem
 * perder de vez o efeito 3D (o Waze de verdade também inclina um pouco durante a navegação). */
const BROWSE_PITCH = 54;
const FOLLOW_PITCH = 30;

/** Abaixo deste zoom, os imóveis aparecem como um pin pequeno (sem o preço escrito) — do
 * contrário as etiquetas com preço se sobrepõem e poluem o mapa quando há muitos imóveis
 * próximos uns dos outros. Zoom mais próximo revela a etiqueta completa com o preço. */
const PRICE_LABEL_MIN_ZOOM = 16;

function isClusterProps(props: PointProps | ClusterProps): props is ClusterProps {
  return (props as ClusterProps).cluster === true;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    properties,
    radarById,
    selectedId,
    onSelectProperty,
    userPosition,
    satellite,
    onMapReady,
    onMapClick,
    initialCenter,
    initialZoom,
    followHeading,
    onFollowPausedChange,
    routeCoordinates,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const poiMarkersRef = useRef<Map<string, Marker>>(new Map());
  const poiAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const bairroMarkersRef = useRef<Marker[]>([]);
  const marcoMarkersRef = useRef<Marker[]>([]);
  const [nearbyPois, setNearbyPois] = useState<POI[]>([]);
  const clusterIndexRef = useRef<Supercluster<PointProps, ClusterProps> | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const hasInitialZoomRef = useRef(false);
  const followingRef = useRef(true);
  const followHeadingRef = useRef(followHeading);
  const onFollowPausedChangeRef = useRef(onFollowPausedChange);
  const userPositionRef = useRef(userPosition);
  followHeadingRef.current = followHeading;
  onFollowPausedChangeRef.current = onFollowPausedChange;
  userPositionRef.current = userPosition;

  const setFollowing = (value: boolean) => {
    if (followingRef.current === value) return;
    followingRef.current = value;
    onFollowPausedChangeRef.current?.(!value);
  };

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 16) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, essential: true, duration: 900 });
    },
    getMap: () => mapRef.current,
    // Recentraliza na hora com a última posição conhecida, em vez de só religar a bandeira e
    // esperar a próxima atualização do GPS chegar (que pode demorar alguns segundos e dar a
    // impressão de que o botão "Recentralizar" não fez nada).
    resumeFollow: () => {
      setFollowing(true);
      const map = mapRef.current;
      const pos = userPositionRef.current;
      if (map && pos) {
        map.easeTo({
          center: [pos.lng, pos.lat],
          bearing: followHeadingRef.current ? (pos.heading ?? map.getBearing()) : map.getBearing(),
          duration: 500,
          easing: (t) => t,
        });
      }
    },
  }));

  // reinicia o acompanhamento sempre que o modo GPS é (re)ativado
  useEffect(() => {
    if (followHeading) setFollowing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followHeading]);

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STREETS_STYLE,
      center: [initialCenter?.lng ?? OLINDA_CENTER.lng, initialCenter?.lat ?? OLINDA_CENTER.lat],
      zoom: initialZoom ?? 14,
      pitch: followHeading ? FOLLOW_PITCH : BROWSE_PITCH,
      attributionControl: { compact: true },
      pitchWithRotate: false,
    });

    map.addControl(new NavigationControl({ showCompass: true }), "bottom-right");

    map.on("load", () => {
      setStyleLoaded(true);
      onMapReady?.();
    });

    // Se o usuário arrastar/girar o mapa manualmente durante o modo GPS, paramos de forçar a
    // câmera pra ele poder olhar em volta — "Recentralizar" (resumeFollow) retoma. Importante:
    // só conta como "manual" quando o evento tem `originalEvent` (veio de mouse/touch de
    // verdade) — nosso próprio `easeTo({ bearing })` do modo GPS também dispara "rotatestart",
    // mas sem originalEvent, e não deve se autodetectar como um arraste do usuário.
    const handleManualOverride = (e: { originalEvent?: unknown }) => {
      if (followHeadingRef.current && e.originalEvent) setFollowing(false);
    };
    map.on("dragstart", handleManualOverride);
    map.on("rotatestart", handleManualOverride);

    if (onMapClick) {
      map.on("click", (e) => onMapClick(e.lngLat.lat, e.lngLat.lng));
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switch base style
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setStyleLoaded(false);
    map.setStyle(satellite ? SATELLITE_STYLE : STREETS_STYLE);
    map.once("styledata", () => setStyleLoaded(true));
  }, [satellite]);

  // build/update clustering + markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const points: Array<Feature<Point, PointProps>> = properties.map((p) => ({
      type: "Feature",
      properties: { propertyId: p.id },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    }));

    const index = new Supercluster<PointProps, ClusterProps>({
      radius: 52,
      maxZoom: 18,
    }).load(points);
    clusterIndexRef.current = index;

    const render = () => {
      const current = mapRef.current;
      if (!current) return;
      const bounds = current.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const exactZoom = current.getZoom();
      const zoom = Math.floor(exactZoom);
      const showPriceLabel = exactZoom >= PRICE_LABEL_MIN_ZOOM;
      const clusters = index.getClusters(bbox, zoom) as ClusterFeature[];

      const nextKeys = new Set<string>();

      for (const feature of clusters) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const isCluster = isClusterProps(props);
        const key = isCluster ? `cluster-${props.cluster_id}` : `point-${props.propertyId}`;
        nextKeys.add(key);

        let marker = markersRef.current.get(key);

        if (!marker) {
          const el = document.createElement("div");
          marker = new Marker({ element: el, anchor: isCluster ? "center" : "bottom" })
            .setLngLat([lng, lat])
            .addTo(current);
          markersRef.current.set(key, marker);
        } else {
          marker.setLngLat([lng, lat]);
        }

        const el = marker.getElement();

        if (isClusterProps(props)) {
          const clusterId = props.cluster_id;
          const count = props.point_count;
          el.innerHTML = "";
          // "maplibregl-marker" tem que continuar na lista de classes — é ela que traz
          // `position:absolute;top:0;left:0` do CSS da própria lib. Sem isso o elemento vira
          // position:static e o `transform: translate(...)` que o MapLibre aplica no elemento
          // passa a valer a partir da posição dele no fluxo normal do documento (que muda toda
          // vez que um marcador é criado/removido/reordenado), em vez do canto do mapa — é
          // exatamente o bug do pin "pulando de canto" ao dar zoom.
          el.className =
            "maplibregl-marker flex items-center justify-center rounded-full bg-deep-green text-off-white font-bold shadow-[var(--shadow-float)] border-2 border-emerald cursor-pointer select-none";
          const size = count < 10 ? 40 : count < 30 ? 48 : 56;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.fontSize = count < 30 ? "13px" : "14px";
          el.textContent = String(count);
          el.onclick = () => {
            const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
            current.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
          };
        } else {
          const propertyId = props.propertyId;
          const property = properties.find((p) => p.id === propertyId);
          if (!property) continue;

          const radar = radarById?.[propertyId];
          const opportunity = radar ? isOportunidade(radar) : false;
          const selected = selectedId === propertyId;

          // Importante: nunca definir el.style.transform aqui — o MapLibre usa essa
          // propriedade no elemento raiz do marcador para posicioná-lo no mapa.
          // Qualquer escala/transform visual deve ficar num wrapper filho.
          // inline-block: garante que a "caixa" do marcador encolha pro tamanho do conteúdo —
          // sem isso, se o MapLibre não tiver aplicado seu posicionamento absoluto ainda no
          // momento do innerHTML, o pin vira uma barra esticada na largura inteira do mapa
          // (bug visto num iPhone real: etiqueta de preço virou uma faixa cobrindo a tela toda).
          // "maplibregl-marker" tem que continuar na lista de classes (ver comentário igual
          // acima, no bloco de cluster) — sem ela o pin "pula de canto" ao dar zoom.
          el.className = "maplibregl-marker inline-block cursor-pointer select-none";
          el.innerHTML = showPriceLabel
            ? `
            <div style="display:inline-block;transform:${selected ? "scale(1.1)" : "scale(1)"};transition:transform .15s ease;animation:morai-pin-pop .35s cubic-bezier(.34,1.56,.64,1);">
              <div style="
                display:inline-flex;align-items:center;gap:3px;
                background:${selected ? "#C5FF35" : "#003D32"};
                color:${selected ? "#003D32" : "#F5F7F2"};
                padding:3px 8px 3px 4px;border-radius:999px;
                font-weight:700;font-size:11px;white-space:nowrap;
                box-shadow:0 4px 10px rgba(6,42,36,0.25);
                border:1.5px solid ${opportunity ? "#C5FF35" : "transparent"};
              ">
                <span style="
                  display:flex;align-items:center;justify-content:center;
                  width:13px;height:13px;border-radius:999px;flex-shrink:0;
                  background:${selected ? "rgba(0,61,50,0.14)" : "rgba(197,255,53,0.9)"};
                  color:${selected ? "#003D32" : "#003D32"};
                ">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                ${opportunity ? '<span style="width:5px;height:5px;border-radius:999px;background:#C5FF35;display:inline-block;"></span>' : ""}
                <span>${formatCompactPrice(property.preco)}${property.finalidade === "aluguel" ? "/mês" : ""}</span>
              </div>
              <div style="width:0;height:0;margin:0 auto;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${selected ? "#C5FF35" : "#003D32"};"></div>
            </div>
          `
            : `
            <div style="position:relative;transform:${selected ? "scale(1.15)" : "scale(1)"};transform-origin:bottom center;transition:transform .15s ease;animation:morai-pin-pop .35s cubic-bezier(.34,1.56,.64,1);display:inline-flex;">
              <img src="/map-assets/markers/${selected ? "selecionado" : "imovel"}.png" alt="" width="30" height="37" style="display:block;filter:drop-shadow(0 4px 6px rgba(6,42,36,0.3));" />
              ${opportunity ? '<span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:999px;background:#C5FF35;border:1.5px solid #F5F7F2;"></span>' : ""}
            </div>
          `;
          el.onclick = (e) => {
            e.stopPropagation();
            onSelectProperty(propertyId);
          };
        }
      }

      for (const [key, marker] of markersRef.current.entries()) {
        if (!nextKeys.has(key)) {
          marker.remove();
          markersRef.current.delete(key);
        }
      }
    };

    render();
    map.on("moveend", render);
    map.on("zoomend", render);

    return () => {
      map.off("moveend", render);
      map.off("zoomend", render);
    };
  }, [properties, radarById, selectedId, onSelectProperty, styleLoaded]);

  // user position marker — seta direcional (tipo GPS de navegação) quando sabemos o rumo,
  // ponto simples quando ainda não temos direção de deslocamento
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      poiAnchorRef.current = null;
      setNearbyPois([]);
      return;
    }

    const heading = userPosition.heading ?? null;
    // Em modo "câmera acompanha a direção" (followHeading), é o MAPA que gira pra alinhar o
    // rumo com "pra cima" na tela — a seta fica sempre apontando pra cima, como no Waze.
    // Sem esse modo, é a seta que gira sobre o mapa fixo (norte sempre pra cima).
    const arrowRotation = followHeading ? 0 : (heading ?? 0);

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      // "maplibregl-marker" precisa continuar na lista de classes, senão o posicionamento
      // quebra ao dar zoom (ver comentário detalhado no loop de marcadores de imóvel acima).
      el.className = "maplibregl-marker relative flex items-center justify-center";
      userMarkerRef.current = new Marker({ element: el, anchor: "center" })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }

    const el = userMarkerRef.current.getElement();
    // Azul (não o verde da marca) de propósito: é a cor universal de "sua localização" em
    // apps de navegação (Google Maps, Waze, Apple Maps) — pedido explícito do briefing visual
    // pra reforçar a leitura de GPS/navegação em vez de portal imobiliário.
    el.innerHTML =
      heading === null
        ? `
          <div class="absolute h-10 w-10 rounded-full animate-pulse-ring" style="background:rgba(30,136,229,0.25);"></div>
          <div class="relative h-4 w-4 rounded-full border-2 border-white shadow-md" style="background:#1E88E5;"></div>
        `
        : `
          <div class="absolute h-12 w-12 rounded-full animate-pulse-ring" style="background:rgba(30,136,229,0.22);"></div>
          <div style="transform:rotate(${arrowRotation}deg);transition:transform .2s linear;">
            <svg width="30" height="30" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10.5" fill="#1E88E5" stroke="white" stroke-width="2"/>
              <path d="M12 5.5 L16.5 15.5 L12 13 L7.5 15.5 Z" fill="white"/>
            </svg>
          </div>
        `;
  }, [userPosition, styleLoaded, followHeading]);

  // busca pontos de interesse reais perto da posição atual (Overpass/OpenStreetMap) pra exibir
  // como pills no mapa (farmácia, escola, praia etc. — ver seção "Moraí Maps" em
  // DESIGN_SYSTEM.md). Só refaz a busca quando o usuário se afasta o bastante do último ponto
  // consultado, nunca a cada atualização de GPS — a Overpass é uma API gratuita de uso justo.
  useEffect(() => {
    if (!userPosition) return;

    const previous = poiAnchorRef.current;
    if (previous && haversineMeters(previous, userPosition) < POI_REFETCH_DISTANCE_METERS) return;
    poiAnchorRef.current = { lat: userPosition.lat, lng: userPosition.lng };

    let cancelled = false;

    fetchNearbyPOIs(userPosition.lat, userPosition.lng, POI_SEARCH_RADIUS_METERS, MAP_POI_CATEGORIES)
      .then((data) => {
        if (!cancelled) setNearbyPois(data.pois);
      })
      .catch(() => {
        /* silencioso — pills de POI são um complemento visual, não essencial ao mapa funcionar */
      });

    return () => {
      cancelled = true;
    };
  }, [userPosition]);

  // renderiza as pills de POI próximo: só o mais próximo de cada categoria, limitado a
  // MAX_POI_PILLS no total, pra não poluir o mapa.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const nearestByCategory = new Map<POICategory, POI>();
    for (const poi of nearbyPois) {
      const current = nearestByCategory.get(poi.categoria);
      if (!current || poi.distanciaMetros < current.distanciaMetros) {
        nearestByCategory.set(poi.categoria, poi);
      }
    }
    const toShow = [...nearestByCategory.values()]
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros)
      .slice(0, MAX_POI_PILLS);

    const nextKeys = new Set(toShow.map((p) => p.id));

    for (const poi of toShow) {
      let marker = poiMarkersRef.current.get(poi.id);
      if (!marker) {
        const el = document.createElement("div");
        marker = new Marker({ element: el, anchor: "bottom" }).setLngLat([poi.lng, poi.lat]).addTo(map);
        poiMarkersRef.current.set(poi.id, marker);
      }

      const el = marker.getElement();
      el.className = "maplibregl-marker pointer-events-none select-none";
      el.innerHTML = `
        <div style="display:inline-flex;flex-direction:column;align-items:center;animation:morai-pin-pop .35s cubic-bezier(.34,1.56,.64,1);">
          <div style="
            display:inline-flex;align-items:center;gap:6px;
            background:#F5F7F2;color:#003D32;
            padding:6px 12px 6px 8px;border-radius:999px;
            box-shadow:0 4px 10px rgba(6,42,36,0.18);
            white-space:nowrap;
          ">
            <span style="
              display:flex;align-items:center;justify-content:center;
              width:22px;height:22px;border-radius:999px;flex-shrink:0;
              background:rgba(0,61,50,0.08);color:#003D32;
            ">${getPoiIconSvg(poi.categoria)}</span>
            <span style="display:flex;flex-direction:column;line-height:1.15;">
              <span style="font-size:11.5px;font-weight:700;">${poi.nome}</span>
              <span style="font-size:10px;font-weight:500;color:rgba(0,61,50,0.6);">${formatDistance(poi.distanciaMetros)}</span>
            </span>
          </div>
          <div style="width:6px;height:6px;margin-top:3px;border-radius:999px;background:#003D32;border:1.5px solid #F5F7F2;"></div>
        </div>
      `;
    }

    for (const [id, marker] of poiMarkersRef.current.entries()) {
      if (!nextKeys.has(id)) {
        marker.remove();
        poiMarkersRef.current.delete(id);
      }
    }
  }, [nearbyPois, styleLoaded]);

  // câmera "modo GPS": segue a posição e gira pra manter a direção de deslocamento pra cima.
  // Na primeíssima localização recebida (app recém-aberto), além de centralizar também damos
  // um zoom de perto — o Moraí deve abrir já "no lugar", como um app de navegação, em vez de
  // abrir num zoom genérico da cidade e só depois deslizar até o usuário.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || !userPosition || !followHeading || !followingRef.current) return;

    const primeiraLocalizacao = !hasInitialZoomRef.current;
    hasInitialZoomRef.current = true;

    map.easeTo({
      center: [userPosition.lng, userPosition.lat],
      zoom: primeiraLocalizacao ? Math.max(map.getZoom(), 16) : map.getZoom(),
      bearing: userPosition.heading ?? map.getBearing(),
      duration: primeiraLocalizacao ? 1200 : 500,
      easing: (t) => t,
    });
  }, [userPosition, styleLoaded, followHeading]);

  // ao sair do modo GPS, volta suavemente pro norte fixo e inclina a câmera (visual de maquete);
  // ao entrar, achata pra visão de cima (mais clara pra andar/dirigir)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (followHeading) {
      map.easeTo({ pitch: FOLLOW_PITCH, duration: 600 });
    } else {
      map.resetNorth({ duration: 600 });
      map.easeTo({ pitch: BROWSE_PITCH, duration: 600 });
    }
  }, [followHeading]);

  // Linha da rota real (pelas ruas) do Modo Passeio — some sozinha quando `routeCoordinates`
  // fica nulo/vazio (destino cancelado ou rota ainda não calculada). Precisa ser refeita depois
  // de qualquer `setStyle` (troca de satélite/ruas apaga fontes e camadas customizadas).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const hasCoords = !!routeCoordinates && routeCoordinates.length > 1;
    const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;

    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeCoordinates ?? [] },
      });
      return;
    }

    if (!hasCoords) return;

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoordinates! } },
    });
    // Azul tracejado (mesma convenção universal de "rota ativa" em apps de navegação, ver
    // comentário no marcador de localização acima) — casing branco embaixo pra legibilidade
    // sobre qualquer fundo (mar, areia, construção).
    map.addLayer({
      id: "morai-route-casing",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#FFFFFF", "line-width": 7, "line-opacity": 0.85 },
    });
    map.addLayer({
      id: "morai-route-line",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#1E88E5",
        "line-width": 4,
        "line-dasharray": [0.1, 1.6],
      },
    });
  }, [routeCoordinates, styleLoaded]);

  // Nomes de bairro direto no mapa (sem pill, texto em negrito com sombra suave — igual ao
  // briefing visual) a partir de dados reais já usados em "Meu Bairro Ideal"
  // (src/lib/data/olinda-bairros.ts, geocodificados via Nominatim). Estático: cria uma vez por
  // carregamento de estilo (ex.: depois de alternar satélite/ruas, que apaga marcadores soltos
  // não — os Markers do MapLibre não são apagados pelo setStyle — mas recriar é inofensivo e
  // simples de manter consistente com o resto do arquivo).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || bairroMarkersRef.current.length > 0) return;

    for (const bairro of OLINDA_BAIRROS) {
      const el = document.createElement("div");
      el.className = "maplibregl-marker pointer-events-none select-none";
      el.innerHTML = `
        <span style="
          font-weight:800;font-size:13px;color:#2E4A2A;white-space:nowrap;
          text-shadow:0 1px 0 rgba(255,251,242,0.9),0 0 6px rgba(255,251,242,0.9);
        ">${bairro.nome}</span>
      `;
      bairroMarkersRef.current.push(
        new Marker({ element: el, anchor: "left" }).setLngLat([bairro.lng, bairro.lat]).addTo(map),
      );
    }

    return () => {
      for (const marker of bairroMarkersRef.current) marker.remove();
      bairroMarkersRef.current = [];
    };
  }, [styleLoaded]);

  // Marcos históricos reais de Olinda (ícone + rótulo, sem pill — ver
  // src/lib/data/olinda-marcos.ts e as coordenadas verificadas lá documentadas).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || marcoMarkersRef.current.length > 0) return;

    for (const marco of OLINDA_MARCOS) {
      const el = document.createElement("div");
      el.className = "maplibregl-marker pointer-events-none select-none";
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="
            display:flex;align-items:center;justify-content:center;
            width:20px;height:20px;border-radius:999px;flex-shrink:0;
            background:rgba(255,251,242,0.85);box-shadow:0 1px 3px rgba(0,0,0,0.15);
          ">${getMarcoIconSvg(marco.icone)}</span>
          <span style="
            font-weight:700;font-size:11.5px;color:#2E4A2A;white-space:nowrap;
            text-shadow:0 1px 0 rgba(255,251,242,0.9),0 0 6px rgba(255,251,242,0.9);
          ">${marco.nome}</span>
        </div>
      `;
      marcoMarkersRef.current.push(
        new Marker({ element: el, anchor: "left" }).setLngLat([marco.lng, marco.lat]).addTo(map),
      );
    }

    return () => {
      for (const marker of marcoMarkersRef.current) marker.remove();
      marcoMarkersRef.current = [];
    };
  }, [styleLoaded]);

  return <div ref={containerRef} className="h-full w-full" />;
});
