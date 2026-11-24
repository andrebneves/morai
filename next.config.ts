import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App majoritariamente client-side (mapa interativo); cacheComponents/PPR
  // desativados para evitar complexidade de cache desnecessária nesta fase.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
