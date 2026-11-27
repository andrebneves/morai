import type { StyleSpecification } from "maplibre-gl";
import libertyBase from "@/components/map/libertyBase.json";

/**
 * Paleta "Moraí Classic" — reestiliza o mapa base do OpenFreeMap (esquema OpenMapTiles,
 * estilo "liberty") com a identidade visual própria do Moraí: mar turquesa, praia em tom
 * natural de areia, ruas claras e legíveis, construções em bege/pastel com sombra suave —
 * em vez do visual fotorrealista padrão de mapa. Só sobrescreve propriedades de cor
 * (fill-color, line-color, text-color etc.) — geometria, zoom e espessura das
 * linhas permanecem as originais do estilo base. Substitui a paleta anterior ("Moraí Toy",
 * mais saturada/estilo jogo de simulação), por pedido explícito do briefing de direção de
 * arte do motor cartográfico — ver seção "Moraí Maps" em DESIGN_SYSTEM.md.
 *
 * `libertyBase.json` é um snapshot de https://tiles.openfreemap.org/styles/liberty
 * (sources/sprite/glyphs apontam para URLs absolutas da OpenFreeMap, então
 * funciona normalmente mesmo sendo servido localmente).
 */
const MORAI_CLASSIC_PAINT_OVERRIDES: Record<string, Record<string, unknown>> = {
  background: { "background-color": "#F3EDDD" },
  natural_earth: { "raster-opacity": 0 },

  park: {
    "fill-color": "#A3D18A",
    "fill-opacity": 0.85,
    "fill-outline-color": "rgba(255,255,255,0.6)",
  },
  park_outline: { "line-color": "rgba(255,255,255,0.6)" },

  landuse_residential: {
    "fill-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      9,
      "hsla(38,40%,94%,0.5)",
      12,
      "hsla(38,45%,91%,0.4)",
    ],
  },
  landcover_wood: { "fill-color": "hsla(100,38%,46%,0.55)", "fill-opacity": 0.5 },
  landcover_grass: { "fill-color": "rgba(168,205,140,1)", "fill-opacity": 0.5 },
  landcover_ice: { "fill-color": "rgba(224,245,250,1)" },
  landuse_pitch: { "fill-color": "#CDE3B0" },
  landuse_track: { "fill-color": "#EAD9AE" },
  landuse_cemetery: { "fill-color": "hsl(90,25%,82%)" },
  landuse_hospital: { "fill-color": "#FBD7E0" },
  landuse_school: { "fill-color": "#FBEEC0" },
  // Praia em tom natural de areia (pedido explícito: "praias em tons naturais de areia").
  landcover_sand: { "fill-color": "#F3E1C3" },

  // Mar azul-turquesa (pedido explícito), mais claro perto da costa e mais profundo no mar aberto.
  water: {
    "fill-color": ["interpolate", ["linear"], ["zoom"], 10, "#5BD1D9", 16, "#2CC7D4"],
  },

  // Construções em bege e tons pastéis, sombra suave (pedido explícito) — antes era um
  // pêssego/terracota mais saturado ("Moraí Toy").
  building: {
    "fill-color": "#E9DEC4",
    "fill-outline-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      13,
      "hsla(35,25%,55%,0.35)",
      14,
      "hsl(35,25%,48%)",
    ],
  },
  // Prédios 3D (fill-extrusion com render_height/render_min_height reais do OpenMapTiles,
  // não inventados) na mesma paleta bege/pastel, com leve variação por altura pra dar volume
  // e sombra suave sem virar "maquete de jogo" como antes.
  "building-3d": {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["get", "render_height"],
      0,
      "#F2E9D6",
      8,
      "#E9DEC4",
      25,
      "#CDBB95",
    ],
    "fill-extrusion-opacity": 0.92,
  },

  // Ruas claras e de alta legibilidade (pedido explícito) — tons neutros/creme em vez do
  // laranja/creme saturado anterior; a hierarquia viária continua clara pela espessura e
  // pela leve diferença de tom, não por saturação.
  road_minor_casing: { "line-color": "#DCD2B8" },
  road_secondary_tertiary_casing: { "line-color": "#E3CFA0" },
  road_secondary_tertiary: { "line-color": "#FBF4E3" },
  road_trunk_primary_casing: { "line-color": "#D9B87E" },
  road_trunk_primary: { "line-color": "#FDF8EC" },
  road_motorway_casing: { "line-color": "#C98F52" },
  road_motorway: {
    "line-color": ["interpolate", ["linear"], ["zoom"], 5, "hsl(30,70%,62%)", 6, "#F2B467"],
  },
  road_path_pedestrian: { "line-color": "#E8DCC0" },

  boundary_2: { "line-color": "hsl(130,16%,50%)" },
  boundary_3: { "line-color": "hsl(130,12%,68%)" },

  label_city: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBF2" },
  label_city_capital: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBF2" },
  label_town: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBF2" },
  label_village: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBF2" },
  label_other: { "text-color": "#2E4A2A", "text-halo-color": "#FFFBF2" },
  poi_r20: { "text-color": "#4A3728", "text-halo-color": "#FFFBF2" },
  poi_r7: { "text-color": "#4A3728", "text-halo-color": "#FFFBF2" },
  poi_r1: { "text-color": "#4A3728", "text-halo-color": "#FFFBF2" },
};

// Classes de POI com ilustração isométrica própria (biblioteca "Moraí Maps" —
// design/map-assets/, gerada em public/map-assets/sprites/morai-poi por
// scripts/generate-poi-sprite.mjs). Essas ilustrações são "de pé" na coordenada (perspectiva de
// prédio, não um pino centralizado), então os layers de POI precisam de `icon-anchor: "bottom"`
// só para essas classes — o restante (ícone padrão da OpenFreeMap) continua ancorado ao centro.
const MORAI_ILLUSTRATED_POI_CLASSES = [
  "pharmacy",
  "hospital",
  "doctors",
  "school",
  "college",
  "bakery",
  "restaurant",
  "cafe",
  "fast_food",
  "fuel",
  "bank",
  "post",
  "museum",
  "attraction",
  "place_of_worship",
  "park",
  "shop",
  "supermarket",
  "police",
  "fire_station",
];

const POI_ICON_ANCHOR_LAYOUT = {
  "icon-anchor": [
    "match",
    ["get", "class"],
    MORAI_ILLUSTRATED_POI_CLASSES,
    "bottom",
    "center",
  ],
};

const MORAI_CLASSIC_LAYOUT_OVERRIDES: Record<string, Record<string, unknown>> = {
  poi_r20: POI_ICON_ANCHOR_LAYOUT,
  poi_r7: POI_ICON_ANCHOR_LAYOUT,
  poi_r1: POI_ICON_ANCHOR_LAYOUT,
};

function buildMoraiClassicStyle(base: unknown): StyleSpecification {
  const style = JSON.parse(JSON.stringify(base)) as StyleSpecification;
  for (const layer of style.layers) {
    const paintOverrides = MORAI_CLASSIC_PAINT_OVERRIDES[layer.id];
    if (paintOverrides) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer as any).paint = { ...(layer as any).paint, ...paintOverrides };
    }
    const layoutOverrides = MORAI_CLASSIC_LAYOUT_OVERRIDES[layer.id];
    if (layoutOverrides) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layer as any).layout = { ...(layer as any).layout, ...layoutOverrides };
    }
  }
  // Sprite própria "Moraí Maps": mesmo conjunto de ícones padrão da OpenFreeMap (nenhuma classe
  // não-customizada muda) + ilustrações isométricas próprias nas classes acima — ver
  // scripts/generate-poi-sprite.mjs e design/map-assets/. MapLibre exige URL absoluta pro
  // `sprite`; como este módulo pode ser avaliado durante SSR (sem `window`), resolve o origin em
  // runtime no cliente e cai num caminho relativo inofensivo no servidor (nunca usado lá).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  style.sprite = `${origin}/map-assets/sprites/morai-poi`;
  // Luz suave e neutra (menos quente/intensa que a versão "Moraí Toy") — sombra sutil nos
  // prédios extrudados sem reforçar a leitura de "maquete de jogo".
  style.light = {
    anchor: "viewport",
    color: "hsl(40, 60%, 96%)",
    intensity: 0.45,
    position: [1.2, 200, 42],
  };
  return style;
}

/**
 * Estilo de ruas "Moraí Classic": tiles vetoriais gratuitos da OpenFreeMap (sem API key),
 * reestilizados com a paleta acima para dar a identidade visual própria do Moraí — GPS
 * sofisticado e legível, com mar turquesa e areia natural, em vez da aparência padrão
 * cinza de mapa.
 */
export const STREETS_STYLE: StyleSpecification = buildMoraiClassicStyle(libertyBase);

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
