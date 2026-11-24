import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moraí — o GPS do mercado imobiliário",
    short_name: "Moraí",
    description:
      "Sua próxima casa pode estar na próxima esquina. Explore o mapa, descubra imóveis e conheça bairros em tempo real.",
    start_url: "/mapa?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#062a24",
    theme_color: "#003d32",
    lang: "pt-BR",
    categories: ["lifestyle", "navigation", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  };
}
