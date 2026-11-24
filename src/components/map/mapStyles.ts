import type { StyleSpecification } from "maplibre-gl";
import libertyBase from "@/components/map/libertyBase.json";

/**
 * Paleta "Moraí Toy" — reestiliza o mapa base do OpenFreeMap (esquema OpenMapTiles,
 * estilo "liberty") com cores vivas, estilo jogo de simulação (SimCity/The Sims),
 * em vez do visual fotorrealista padrão. Só sobrescreve propriedades de cor
 * (fill-color, line-color, text-color etc.) — geometria, zoom e espessura das
 * linhas permanecem as originais do estilo base.
 *
 * `libertyBase.json` é um snapshot de https://tiles.openfreemap.org/styles/liberty
 * (sources/sprite/glyphs apontam para URLs absolutas da OpenFreeMap, então
 * funciona normalmente mesmo sendo servido localmente).
 */
const TOY_PAINT_OVERRIDES: Record<string, Record<string, unknown>> = {
  background: { "background-color": "#DCEFC9" },
  natural_earth: { "raster-opacity": 0 },

  park: {
    "fill-color": "#A9DD78",
    "fill-opacity": 0.92,
    "fill-outline-color": "rgba(255,255,255,0.6)",
  },
  park_outline: { "line-color": "rgba(255,255,255,0.6)" },

  landuse_residential: {
    "fill-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      9,
      "hsla(35,45%,93%,0.55)",
      12,
      "hsla(35,60%,90%,0.45)",
    ],
  },
  landcover_wood: { "fill-color": "hsla(100,62%,42%,0.65)", "fill-opacity": 0.55 },
  landcover_grass: { "fill-color": "rgba(150,214,110,1)", "fill-opacity": 0.6 },
  landcover_ice: { "fill-color": "rgba(224,245,250,1)" },
  landuse_pitch: { "fill-color": "#CFF0A0" },
  landuse_track: { "fill-color": "#F0DDA0" },
  landuse_cemetery: { "fill-color": "hsl(90,35%,80%)" },
  landuse_hospital: { "fill-color": "#FBD7E0" },
  landuse_school: { "fill-color": "#FDEFAE" },
  landcover_sand: { "fill-color": "#F6E3B0" },

  water: {
    "fill-color": ["interpolate", ["linear"], ["zoom"], 10, "#4FB8D8", 16, "#2E9FC9"],
  },

  building: {
    "fill-color": "#F6C49A",
    "fill-outline-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      "hsla(20,55%,55%,0.4)",
      14,
      "hsl(20,55%,50%)",
    ],
  },
  // Pequena variação de tom pela altura do prédio (render_height) — dá uma sensação de
  // "maquete"/diorama em vez de blocos idênticos, igual às casinhas do The Sims.
  "building-3d": {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["get", "render_height"],
      0,
      "#FBDBB4",
      8,
      "#F6C49A",
      25,
      "#E09C68",
    ],
    "fill-extrusion-opacity": 0.95,
  },

  road_minor_casing: { "line-color": "#D9C79A" },
  road_secondary_tertiary_casing: { "line-color": "#E0A868" },
  road_secondary_tertiary: { "line-color": "#FFE9B8" },
  road_trunk_primary_casing: { "line-color": "#D98A4A" },
  road_trunk_primary: { "line-color": "#FFD9A0" },
  road_motorway_casing: { "line-color": "#C96A2E" },
  road_motorway: {
    "line-color": ["interpolate", ["linear"], ["zoom"], 5, "hsl(16,85%,55%)", 6, "#FF9B4A"],
  },
  road_path_pedestrian: { "line-color": "#E7D2A0" },

  boundary_2: { "line-color": "hsl(130,20%,45%)" },
  boundary_3: { "line-color": "hsl(130,15%,65%)" },

  label_city: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBEF" },
  label_city_capital: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBEF" },
  label_town: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBEF" },
  label_village: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBEF" },
  label_other: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBEF" },
  poi_r20: { "text-color": "#4A3728", "text-halo-color": "#FFFBEF" },
  poi_r7: { "text-color": "#4A3728", "text-halo-color": "#FFFBEF" },
  poi_r1: { "text-color": "#4A3728", "text-halo-color": "#FFFBEF" },
};

function buildToyStyle(base: unknown): StyleSpecification {
  const style = JSON.parse(JSON.stringify(base)) as StyleSpecification;
  for (const layer of style.layers) {
    const overrides = TOY_PAINT_OVERRIDES[layer.id];
    if (!overrides) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layer as any).paint = { ...(layer as any).paint, ...overrides };
  }
  // Luz quente e um pouco mais intensa que o padrão do MapLibre — acentua o sombreado das
  // faces dos prédios extrudados (building-3d), reforçando a leitura de "maquete" quando o
  // mapa está inclinado (ver BROWSE_PITCH em MapView.tsx).
  style.light = {
    anchor: "viewport",
    color: "hsl(38, 85%, 92%)",
    intensity: 0.6,
    position: [1.2, 200, 42],
  };
  return style;
}

/**
 * Estilo de ruas "Moraí Toy": tiles vetoriais gratuitos da OpenFreeMap (sem API key),
 * reestilizados com a paleta acima para dar a cara de jogo de simulação pedida pelo
 * produto (Waze no comportamento, SimCity/The Sims na aparência).
 */
export const STREETS_STYLE: StyleSpecification = buildToyStyle(libertyBase);

/**
 * Estilo satélite: imagens Esri World Imagery (endpoint público gratuito, sem API key,
 * amplamente usado em projetos open-source). Revisar os termos da Esri antes de uso em escala.
 */
export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esriSatellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "esriSatellite",
      type: "raster",
      source: "esriSatellite",
    },
  ],
};
