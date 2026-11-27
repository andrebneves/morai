// Gera a sprite própria de ícones de pontos de interesse do Moraí ("Moraí Maps" — biblioteca
// gráfica própria, ver DESIGN_SYSTEM.md). Parte da sprite original da OpenFreeMap (vendorizada em
// scripts/vendor/ofm-sprite/) para manter TODOS os ícones padrão funcionando sem mudança nas
// expressões `icon-image` do estilo base ("liberty"), e ADICIONA, num atlas maior, as ilustrações
// isométricas próprias (design/map-assets/) para as categorias que o Moraí customiza. Os ícones
// customizados usam o mesmo nome de classe OSM (ex.: "pharmacy"), então nenhuma lógica de layer
// precisa mudar — só o `sprite` do estilo passa a apontar pra essa sprite nova.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VENDOR_DIR = path.join(__dirname, "vendor", "ofm-sprite");
const ASSETS_DIR = path.join(ROOT, "design", "map-assets");
const OUT_DIR = path.join(ROOT, "public", "map-assets", "sprites");

// Altura de exibição no mapa (pixels CSS, pixelRatio 1) dos ícones ilustrados — mantém a
// legibilidade da ilustração sem dominar o mapa. Largura escala proporcional à arte original.
const DISPLAY_HEIGHT = 34;

// classe OSM (valor de `class` no vetor OpenMapTiles, usado em icon-image) -> arquivo real em
// design/map-assets/. Cobre as categorias com equivalente direto na biblioteca "Moraí Maps";
// classes sem asset correspondente continuam usando o ícone padrão da OpenFreeMap (não listadas
// aqui — ver DESIGN_SYSTEM.md para o restante do backlog: marcadores, marcos, vegetação etc.).
const CLASS_TO_ASSET = {
  pharmacy: "01_servicos/farmacia.png",
  hospital: "01_servicos/hospital.png",
  doctors: "11_saude/clinica_medica.png",
  school: "01_servicos/escola.png",
  college: "01_servicos/universidade.png",
  bakery: "02_comercio/padaria.png",
  restaurant: "02_comercio/restaurante.png",
  cafe: "02_comercio/cafeteria.png",
  fast_food: "02_comercio/lanchonete.png",
  fuel: "09_mobilidade/posto_combustivel.png",
  bank: "02_comercio/banco.png",
  post: "12_servicos_essenciais/correios.png",
  museum: "10_educacao_cultura/museu.png",
  attraction: "13_esporte_turismo/ponto_turistico.png",
  place_of_worship: "01_servicos/igreja.png",
  park: "03_lazer/parque.png",
  shop: "02_comercio/mercado.png",
  supermarket: "02_comercio/supermercado.png",
  police: "01_servicos/delegacia.png",
  fire_station: "01_servicos/bombeiros.png",
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const pixelRatio of [1, 2]) {
    const suffix = pixelRatio === 2 ? "@2x" : "";
    const basePng = path.join(VENDOR_DIR, `ofm${suffix}.png`);
    const baseIndex = JSON.parse(fs.readFileSync(path.join(VENDOR_DIR, `ofm${suffix}.json`), "utf8"));
    const baseMeta = await sharp(basePng).metadata();

    // Novo atlas: a largura da sprite original + uma faixa extra abaixo pra empacotar os ícones
    // customizados (empacotamento simples em linha, não precisa ser denso — é gerado uma vez).
    const targetH = Math.round(DISPLAY_HEIGHT * pixelRatio);
    const entries = Object.entries(CLASS_TO_ASSET);

    const resized = [];
    for (const [className, relPath] of entries) {
      const srcPath = path.join(ASSETS_DIR, relPath);
      if (!fs.existsSync(srcPath)) {
        console.warn(`Aviso: asset "${relPath}" não encontrado — pulando classe "${className}".`);
        continue;
      }
      const img = sharp(srcPath);
      const meta = await img.metadata();
      const h = targetH;
      const w = Math.round((meta.width / meta.height) * h);
      const buf = await img.resize({ height: h, width: w, fit: "inside" }).png().toBuffer();
      const realMeta = await sharp(buf).metadata();
      resized.push({ className, buf, width: realMeta.width, height: realMeta.height });
    }

    const rowGap = 2 * pixelRatio;
    const extraRowHeight = Math.max(...resized.map((r) => r.height), 0) + rowGap;
    const atlasWidth = Math.max(baseMeta.width, resized.reduce((sum, r) => sum + r.width + rowGap, 0));
    const atlasHeight = baseMeta.height + extraRowHeight;

    const composites = [{ input: basePng, left: 0, top: 0 }];
    const newIndex = { ...baseIndex };
    let cursorX = rowGap;
    const rowTop = baseMeta.height + Math.round(rowGap / 2);
    for (const r of resized) {
      composites.push({ input: r.buf, left: cursorX, top: rowTop });
      newIndex[r.className] = {
        x: cursorX,
        y: rowTop,
        width: r.width,
        height: r.height,
        pixelRatio,
      };
      cursorX += r.width + rowGap;
    }

    await sharp({
      create: {
        width: atlasWidth,
        height: atlasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toFile(path.join(OUT_DIR, `morai-poi${suffix}.png`));

    fs.writeFileSync(
      path.join(OUT_DIR, `morai-poi${suffix}.json`),
      JSON.stringify(newIndex, null, 0),
    );

    console.log(
      `morai-poi${suffix}.png gerado (${atlasWidth}x${atlasHeight}, ${resized.length} ícones próprios + ${Object.keys(baseIndex).length} padrão)`,
    );
  }

  console.log(`Sprite "Moraí Maps" (POI) gerada em ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
