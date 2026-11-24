import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilo de ruas: OpenFreeMap (tiles vetoriais gratuitos, sem necessidade de API key).
 * https://openfreemap.org — uso livre, patrocinado, compatível com MapLibre GL JS.
 */
export const STREETS_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

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
