"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";
import type { Property, RadarResult } from "@/lib/types";
import { formatCompactPrice } from "@/lib/format";
import { isOportunidade } from "@/lib/radar";
import { OLINDA_CENTER } from "@/lib/data/olinda-bairros";
import { STREETS_STYLE, SATELLITE_STYLE } from "@/components/map/mapStyles";

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
}

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
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const clusterIndexRef = useRef<Supercluster<PointProps, ClusterProps> | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
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
          el.className =
            "flex items-center justify-center rounded-full bg-deep-green text-off-white font-bold shadow-[var(--shadow-float)] border-2 border-emerald cursor-pointer select-none";
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
          el.className = "inline-block cursor-pointer select-none";
          el.innerHTML = showPriceLabel
            ? `
            <div style="display:inline-block;transform:${selected ? "scale(1.1)" : "scale(1)"};transition:transform .15s ease;animation:morai-pin-pop .35s cubic-bezier(.34,1.56,.64,1);">
              <div style="
                display:inline-flex;align-items:center;gap:3px;
                background:${selected ? "#00E58A" : "#003D32"};
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
              <div style="width:0;height:0;margin:0 auto;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${selected ? "#00E58A" : "#003D32"};"></div>
            </div>
          `
            : `
            <div style="transform:${selected ? "scale(1.15)" : "scale(1)"};transition:transform .15s ease;animation:morai-pin-pop .35s cubic-bezier(.34,1.56,.64,1);display:inline-flex;flex-direction:column;align-items:center;">
              <div style="
                display:flex;align-items:center;justify-content:center;
                width:22px;height:22px;border-radius:999px;
                background:${selected ? "#00E58A" : "#003D32"};
                border:2px solid ${opportunity ? "#C5FF35" : "rgba(245,247,242,0.75)"};
                box-shadow:0 4px 10px rgba(6,42,36,0.3);
              ">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11.5L12 4l9 7.5" stroke="${selected ? "#003D32" : "#F5F7F2"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" stroke="${selected ? "#003D32" : "#F5F7F2"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div style="width:0;height:0;margin-top:-1px;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${selected ? "#00E58A" : "#003D32"};"></div>
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
      return;
    }

    const heading = userPosition.heading ?? null;
    // Em modo "câmera acompanha a direção" (followHeading), é o MAPA que gira pra alinhar o
    // rumo com "pra cima" na tela — a seta fica sempre apontando pra cima, como no Waze.
    // Sem esse modo, é a seta que gira sobre o mapa fixo (norte sempre pra cima).
    const arrowRotation = followHeading ? 0 : (heading ?? 0);

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center";
      userMarkerRef.current = new Marker({ element: el, anchor: "center" })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }

    const el = userMarkerRef.current.getElement();
    el.innerHTML =
      heading === null
        ? `
          <div class="absolute h-10 w-10 rounded-full bg-emerald/30 animate-pulse-ring"></div>
          <div class="relative h-4 w-4 rounded-full bg-emerald border-2 border-white shadow-md"></div>
        `
        : `
          <div class="absolute h-12 w-12 rounded-full bg-emerald/25 animate-pulse-ring"></div>
          <div style="transform:rotate(${arrowRotation}deg);transition:transform .2s linear;">
            <svg width="30" height="30" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10.5" fill="#00E58A" stroke="white" stroke-width="2"/>
              <path d="M12 5.5 L16.5 15.5 L12 13 L7.5 15.5 Z" fill="white"/>
            </svg>
          </div>
        `;
  }, [userPosition, styleLoaded, followHeading]);

  // câmera "modo GPS": segue a posição e gira pra manter a direção de deslocamento pra cima
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || !userPosition || !followHeading || !followingRef.current) return;

    map.easeTo({
      center: [userPosition.lng, userPosition.lat],
      bearing: userPosition.heading ?? map.getBearing(),
      duration: 500,
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

  return <div ref={containerRef} className="h-full w-full" />;
});
