// MapLibre GL JS carrega seu web worker via `new Worker(url, {type:"module"})`
// apontando para seu próprio bundle. Sob o dev-server/bundler do Next.js (Turbopack)
// essa auto-referência não resolve corretamente, então servimos o worker oficial
// como arquivo estático em /public e apontamos maplibregl.setWorkerUrl() para ele
// (ver src/components/map/MapView.tsx). Este script mantém a cópia sincronizada
// com a versão instalada do pacote.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const dest = path.join(__dirname, "..", "public", "maplibre-gl-worker.mjs");

if (!fs.existsSync(src)) {
  console.warn("[copy-maplibre-worker] arquivo de origem não encontrado, pulando:", src);
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log("[copy-maplibre-worker] copiado para", dest);
