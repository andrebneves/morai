// Gera favicon, ícones de instalação (PWA/Apple Touch) e splash screens do Moraí
// a partir do símbolo (pin + casa) definido em src/components/icons/LogoMark.tsx.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "..", "public", "icons");
const SPLASH_DIR = path.join(__dirname, "..", "public", "splash");

fs.mkdirSync(ICONS_DIR, { recursive: true });
fs.mkdirSync(SPLASH_DIR, { recursive: true });

const DEEP_GREEN = "#003D32";
const DARK_GREEN = "#062A24";

function pinSvg({ bg = null, markScale = 0.74 } = {}) {
  // viewBox 0 0 100 115 do LogoMark, com fundo opcional (para apple-touch-icon / maskable)
  const pin = `
    <path d="M50 4C71.98 4 89.5 21.6 89.5 43.4C89.5 57.3 80.4 69 69.7 80.4C62.9 87.7 56.3 93.9 52.1 106.6C51.4 108.9 48.6 108.9 47.9 106.6C43.7 93.9 37.1 87.7 30.3 80.4C19.6 69 10.5 57.3 10.5 43.4C10.5 21.6 28.02 4 50 4Z" fill="url(#g)" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M50 24L74 45V68C74 70.76 71.76 73 69 73H31C28.24 73 26 70.76 26 68V45L50 24ZM46.5 73V56.5H53.5V73H46.5Z" fill="#F5F7F2" />
    <circle cx="78" cy="30" r="7" fill="#C5FF35" />
  `;
  const size = 100 / markScale;
  const offset = (size - 100) / 2;
  return `
<svg width="${size}" height="${size * 1.15}" viewBox="0 0 ${size} ${size * 1.15}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="12" y1="6" x2="88" y2="108" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00E58A" />
      <stop offset="1" stop-color="#003D32" />
    </linearGradient>
  </defs>
  ${bg ? `<rect width="${size}" height="${size * 1.15}" fill="${bg}" />` : ""}
  <g transform="translate(${offset}, ${offset})">${pin}</g>
</svg>`;
}

async function renderSquare(svg, outPath, sizePx) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 400 })
    .resize(sizePx, sizePx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function main() {
  // Ícones padrão (transparentes)
  const transparentSvg = pinSvg({ markScale: 0.92 });
  await renderSquare(transparentSvg, path.join(ICONS_DIR, "icon-192.png"), 192);
  await renderSquare(transparentSvg, path.join(ICONS_DIR, "icon-512.png"), 512);
  await renderSquare(transparentSvg, path.join(ICONS_DIR, "favicon-32.png"), 32);
  await renderSquare(transparentSvg, path.join(ICONS_DIR, "favicon-16.png"), 16);

  // Ícones maskable (fundo sólido, símbolo centralizado com margem de segurança)
  const maskableSvg = pinSvg({ bg: DEEP_GREEN, markScale: 0.6 });
  await renderSquare(maskableSvg, path.join(ICONS_DIR, "icon-maskable-192.png"), 192);
  await renderSquare(maskableSvg, path.join(ICONS_DIR, "icon-maskable-512.png"), 512);

  // Apple touch icon (iOS não suporta transparência — fundo sólido)
  const appleSvg = pinSvg({ bg: DEEP_GREEN, markScale: 0.68 });
  await renderSquare(appleSvg, path.join(ICONS_DIR, "apple-touch-icon.png"), 180);

  // favicon.ico simples a partir do png 32
  const png32 = await sharp(Buffer.from(transparentSvg), { density: 400 })
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, "..", "src", "app", "favicon.ico"), png32);

  // Splash screens (tela cheia, logo centralizado) — principais resoluções de iPhone
  const splashSizes = [
    { name: "iphone-13-portrait", w: 1170, h: 2532 }, // iPhone 13/13 Pro/14
    { name: "iphone-13-mini-portrait", w: 1080, h: 2340 },
    { name: "iphone-14-pro-max-portrait", w: 1290, h: 2796 },
    { name: "ipad-portrait", w: 1620, h: 2160 },
  ];

  for (const s of splashSizes) {
    const logoSize = Math.round(Math.min(s.w, s.h) * 0.32);
    const logoSvg = pinSvg({ markScale: 0.92 });
    const logoBuf = await sharp(Buffer.from(logoSvg), { density: 400 })
      .resize(logoSize, Math.round(logoSize * 1.15))
      .png()
      .toBuffer();

    const bgSvg = `<svg width="${s.w}" height="${s.h}" xmlns="http://www.w3.org/2000/svg"><rect width="${s.w}" height="${s.h}" fill="${DARK_GREEN}" /></svg>`;

    await sharp(Buffer.from(bgSvg))
      .composite([
        {
          input: logoBuf,
          left: Math.round((s.w - logoSize) / 2),
          top: Math.round(s.h * 0.38),
        },
      ])
      .png()
      .toFile(path.join(SPLASH_DIR, `${s.name}.png`));
  }

  console.log("Ícones e splash screens gerados em public/icons e public/splash");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
