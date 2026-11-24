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
import { STREETS_STYLE_URL, SATELLITE_STYLE } from "@/components/map/mapStyles";

// O auto-bundling do worker do MapLibre não resolve sob o Turbopack dev-server;
// usamos o bundle oficial copiado para /public (ver scripts/copy-maplibre-worker.mjs).
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  getMap: () => MapLibreMap | null;
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
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const clusterIndexRef = useRef<Supercluster<PointProps, ClusterProps> | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 16) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, essential: true, duration: 900 });
    },
    getMap: () => mapRef.current,
  }));

  // init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STREETS_STYLE_URL,
      center: [initialCenter?.lng ?? OLINDA_CENTER.lng, initialCenter?.lat ?? OLINDA_CENTER.lat],
      zoom: initialZoom ?? 14,
      attributionControl: { compact: true },
      pitchWithRotate: false,
    });

    map.addControl(new NavigationControl({ showCompass: true }), "bottom-right");

    map.on("load", () => {
      setStyleLoaded(true);
      onMapReady?.();
    });

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
    map.setStyle(satellite ? SATELLITE_STYLE : STREETS_STYLE_URL);
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
      const zoom = Math.floor(current.getZoom());
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
          el.className = "cursor-pointer select-none";
          el.innerHTML = `
            <div style="transform:${selected ? "scale(1.08)" : "scale(1)"};transition:transform .15s ease;">
              <div style="
                display:flex;align-items:center;gap:4px;
                background:${selected ? "#00E58A" : "#003D32"};
                color:${selected ? "#003D32" : "#F5F7F2"};
                padding:6px 10px;border-radius:999px;
                font-weight:700;font-size:12.5px;white-space:nowrap;
                box-shadow:0 6px 16px rgba(6,42,36,0.28);
                border:2px solid ${opportunity ? "#C5FF35" : "transparent"};
              ">
                ${opportunity ? '<span style="width:6px;height:6px;border-radius:999px;background:#C5FF35;display:inline-block;"></span>' : ""}
                <span>${formatCompactPrice(property.preco)}${property.finalidade === "aluguel" ? "/mês" : ""}</span>
              </div>
              <div style="width:0;height:0;margin:0 auto;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${selected ? "#00E58A" : "#003D32"};"></div>
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

  // user position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center";
      el.innerHTML = `
        <div class="absolute h-10 w-10 rounded-full bg-emerald/30 animate-pulse-ring"></div>
        <div class="relative h-4 w-4 rounded-full bg-emerald border-2 border-white shadow-md"></div>
      `;
      userMarkerRef.current = new Marker({ element: el, anchor: "center" })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }
  }, [userPosition, styleLoaded]);

  return <div ref={containerRef} className="h-full w-full" />;
});
