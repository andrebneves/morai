// Gera os 100 imoveis demonstrativos do Moraí distribuídos pelos bairros reais de Olinda/PE.
// Reproduzível: mesma seed => mesmo dataset. Execução: npm run seed:generate
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "src", "lib", "data", "properties.json");

// --- PRNG determinístico (mulberry32) ---
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(84217);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const intBetween = (min, max) => Math.floor(between(min, max + 1));
const chance = (p) => rand() < p;

const BAIRROS = [
  { nome: "Bairro Novo", cidade: "Olinda", lat: -8.0021881, lng: -34.8426716, raioKm: 0.9, count: 15 },
  { nome: "Casa Caiada", cidade: "Olinda", lat: -7.9846571, lng: -34.8383477, raioKm: 0.8, count: 15 },
  { nome: "Jardim Atlântico", cidade: "Olinda", lat: -7.9743534, lng: -34.8426801, raioKm: 0.9, count: 12 },
  { nome: "Rio Doce", cidade: "Olinda", lat: -7.96569, lng: -34.8317257, raioKm: 0.8, count: 10 },
  { nome: "Carmo", cidade: "Olinda", lat: -8.0169124, lng: -34.8490134, raioKm: 0.5, count: 8 },
  { nome: "Bonsucesso", cidade: "Olinda", lat: -8.0102502, lng: -34.8526796, raioKm: 0.5, count: 6 },
  { nome: "Amparo", cidade: "Olinda", lat: -8.0120938, lng: -34.8545333, raioKm: 0.4, count: 5 },
  { nome: "Varadouro", cidade: "Olinda", lat: -8.019138, lng: -34.8541721, raioKm: 0.5, count: 5 },
  { nome: "Guadalupe", cidade: "Olinda", lat: -8.0076592, lng: -34.8555142, raioKm: 0.4, count: 4 },
  { nome: "Bultrins", cidade: "Olinda", lat: -7.9995002, lng: -34.8501475, raioKm: 0.4, count: 4 },
  { nome: "Fragoso", cidade: "Olinda", lat: -7.9837784, lng: -34.8537899, raioKm: 0.7, count: 4 },
  { nome: "Ouro Preto", cidade: "Olinda", lat: -7.9938659, lng: -34.8597123, raioKm: 0.8, count: 3 },
  { nome: "Jardim Brasil", cidade: "Olinda", lat: -8.0050198, lng: -34.8681399, raioKm: 0.7, count: 3 },
  { nome: "Peixinhos", cidade: "Olinda", lat: -8.0137705, lng: -34.87208, raioKm: 0.6, count: 2 },
  { nome: "Sítio Novo", cidade: "Olinda", lat: -8.0266692, lng: -34.8743755, raioKm: 0.4, count: 2 },
  { nome: "Cidade Tabajara", cidade: "Olinda", lat: -7.9770241, lng: -34.8657206, raioKm: 0.5, count: 1 },
  { nome: "Águas Compridas", cidade: "Olinda", lat: -7.9906074, lng: -34.8976237, raioKm: 0.5, count: 1 },
  // Bairros do Recife adicionados a pedido explícito, pra sócios testarem o Moraí fora de
  // Olinda também. Coordenadas aproximadas (centro estimado a partir de pontos conhecidos do
  // bairro via OpenStreetMap/guiamapa — não são um centroide oficial do IBGE).
  { nome: "Espinheiro", cidade: "Recife", lat: -8.043, lng: -34.8935, raioKm: 0.5, count: 8 },
  { nome: "Ibura", cidade: "Recife", lat: -8.122, lng: -34.93, raioKm: 1.1, count: 8 },
];

const TOTAL = BAIRROS.reduce((s, b) => s + b.count, 0); // 100

const TIPOS = [
  { tipo: "casa", peso: 28 },
  { tipo: "apartamento", peso: 30 },
  { tipo: "casa_condominio", peso: 12 },
  { tipo: "cobertura", peso: 8 },
  { tipo: "kitnet", peso: 10 },
  { tipo: "terreno", peso: 7 },
  { tipo: "comercial", peso: 5 },
];
function sortearTipo() {
  const total = TIPOS.reduce((s, t) => s + t.peso, 0);
  let r = rand() * total;
  for (const t of TIPOS) {
    if (r < t.peso) return t.tipo;
    r -= t.peso;
  }
  return "casa";
}

// Faixas de referência (R$) por tipo, para VENDA (preço total) e por m2 implícito
const FAIXAS = {
  casa: { areaMin: 70, areaMax: 240, precoM2Min: 2200, precoM2Max: 4800 },
  apartamento: { areaMin: 45, areaMax: 140, precoM2Min: 3200, precoM2Max: 6800 },
  casa_condominio: { areaMin: 90, areaMax: 260, precoM2Min: 3500, precoM2Max: 6200 },
  cobertura: { areaMin: 110, areaMax: 280, precoM2Min: 4200, precoM2Max: 8500 },
  kitnet: { areaMin: 22, areaMax: 45, precoM2Min: 3800, precoM2Max: 7200 },
  terreno: { areaMin: 150, areaMax: 600, precoM2Min: 700, precoM2Max: 2200 },
  comercial: { areaMin: 40, areaMax: 300, precoM2Min: 2800, precoM2Max: 5500 },
};

const RUAS = [
  "Rua das Flores", "Rua do Sol", "Rua da Praia", "Avenida Beira Mar", "Rua do Amparo",
  "Rua Nova", "Rua do Carmo", "Travessa da Paz", "Rua dos Coqueiros", "Rua do Sítio",
  "Rua Direita", "Rua do Bonsucesso", "Rua da Matriz", "Alameda das Mangueiras",
  "Rua do Farol", "Rua do Veneza", "Rua do Varadouro", "Rua Prudente de Moraes",
];

const TITULOS = {
  casa: ["Casa charmosa", "Casa espaçosa", "Casa aconchegante", "Casa reformada", "Casa de vila"],
  apartamento: ["Apartamento com vista", "Apartamento compacto", "Apartamento reformado", "Apartamento arejado"],
  casa_condominio: ["Casa em condomínio fechado", "Casa em condomínio com lazer completo"],
  cobertura: ["Cobertura duplex", "Cobertura com terraço gourmet"],
  kitnet: ["Kitnet mobiliada", "Studio compacto"],
  terreno: ["Terreno plano", "Terreno de esquina"],
  comercial: ["Sala comercial", "Ponto comercial", "Loja térrea"],
};

const DESCRICOES_EXTRA_OLINDA = [
  "próximo à orla e a pontos de comércio local.",
  "em rua tranquila e arborizada, perto de escolas.",
  "a poucos minutos do Sítio Histórico de Olinda.",
  "em localização privilegiada, perto de praças e comércio.",
  "com fácil acesso a transporte público e mercados.",
  "em bairro residencial e familiar.",
  "próximo à praia e a restaurantes locais.",
];

const DESCRICOES_EXTRA_RECIFE = [
  "próximo a comércio local e serviços do bairro.",
  "em rua tranquila e arborizada, perto de escolas.",
  "em localização privilegiada, perto de praças e comércio.",
  "com fácil acesso a transporte público e mercados.",
  "em bairro residencial e familiar.",
];

const CARACTERISTICAS_POOL = [
  "aceitaAnimais", "condominioFechado", "piscina", "varanda", "quintal",
  "elevador", "acessibilidade", "mobiliado",
];

function gerarCaracteristicas(tipo) {
  const c = {
    aceitaAnimais: chance(0.55),
    condominioFechado: tipo === "casa_condominio" ? true : chance(0.15),
    piscina: ["casa_condominio", "cobertura"].includes(tipo) ? chance(0.5) : chance(0.12),
    varanda: ["apartamento", "cobertura", "kitnet"].includes(tipo) ? chance(0.6) : chance(0.2),
    quintal: ["casa", "casa_condominio"].includes(tipo) ? chance(0.7) : false,
    elevador: ["apartamento", "cobertura", "comercial"].includes(tipo) ? chance(0.45) : false,
    acessibilidade: chance(0.2),
    mobiliado: tipo === "kitnet" ? chance(0.7) : chance(0.18),
  };
  return c;
}

// deslocamento aleatorio dentro de um raio (km), aproximando metros em graus
function jitterCoord(lat, lng, raioKm) {
  const r = raioKm * Math.sqrt(rand());
  const theta = rand() * 2 * Math.PI;
  const dLat = (r / 111.32) * Math.cos(theta);
  const dLng = (r / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(theta);
  return { lat: lat + dLat, lng: lng + dLng };
}

// Fotos reais de banco gratuito (Unsplash License — uso livre, sem exigência de atribuição),
// organizadas por cômodo/tipo. São ilustrativas: os imóveis do seed são demonstrativos
// (`demo: true`), não correspondem a endereços reais fotografados.
const FOTO_POOL = {
  exterior_casa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1777947151071-f985c78f7070?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1757361653037-dbf0d0a820ae?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  exterior_predio: [
    "https://images.unsplash.com/photo-1781204516306-18eab1d08e7e?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1627799048600-ab328d27f853?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1759352642019-dc5510982676?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1760894492960-5b0a2da0676d?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1766321258844-6541b34b2940?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  sala: [
    "https://images.unsplash.com/photo-1746517757473-7c88850e539b?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1541616138747-f4a42c7f0668?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1616137356540-b13b2a04a507?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  quarto: [
    "https://images.unsplash.com/photo-1750271334785-4f6008035021?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1528908929486-dfaa209c6986?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  cozinha: [
    "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1641823911769-c55f23c25143?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  banheiro: [
    "https://images.unsplash.com/photo-1613849925594-415a32298f54?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1648631478953-1334ce24a24c?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  varanda_vista: [
    "https://images.unsplash.com/photo-1722339141645-b0a1d4eaad50?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1677258523144-a659ca521a07?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1718953585022-ca7ce7fcf23b?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  terreno: [
    "https://images.unsplash.com/photo-1706982803887-82f929f5faa3?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1593978223426-590610a97a06?auto=format&fit=crop&w=960&h=720&q=80",
  ],
  comercial: [
    "https://images.unsplash.com/photo-1672697435797-db092ae0fbd9?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1658843913345-1b92bd88ad6a?auto=format&fit=crop&w=960&h=720&q=80",
    "https://images.unsplash.com/photo-1548688086-f6e309e9690e?auto=format&fit=crop&w=960&h=720&q=80",
  ],
};

function gerarFotos(tipo, n) {
  let capaPool;
  let extraPool;

  if (tipo === "terreno") {
    capaPool = FOTO_POOL.terreno;
    extraPool = FOTO_POOL.terreno;
  } else if (tipo === "comercial") {
    capaPool = FOTO_POOL.comercial;
    extraPool = [...FOTO_POOL.comercial, ...FOTO_POOL.exterior_predio];
  } else {
    const exterior = ["apartamento", "cobertura", "kitnet"].includes(tipo)
      ? FOTO_POOL.exterior_predio
      : FOTO_POOL.exterior_casa;
    const interiores = [...FOTO_POOL.sala, ...FOTO_POOL.quarto, ...FOTO_POOL.cozinha, ...FOTO_POOL.banheiro];
    const vista = tipo === "cobertura" ? FOTO_POOL.varanda_vista : [];
    capaPool = exterior;
    extraPool = [...exterior, ...interiores, ...vista];
  }

  // primeira foto (capa) sempre uma fachada/exterior (ou terreno/fachada comercial) — como um
  // anúncio real; as demais completam embaralhadas do pool, sem repetir a capa
  const capa = pick(capaPool);
  const resto = extraPool.filter((f) => f !== capa);
  const fotos = [capa];
  while (fotos.length < n && resto.length) {
    const idx = Math.floor(rand() * resto.length);
    fotos.push(resto.splice(idx, 1)[0]);
  }
  return fotos;
}

function diasAtras(min, max) {
  const dias = intBetween(min, max);
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function gerarHistoricoPrecos(precoAtual, dataPublicacao) {
  const entradas = intBetween(1, 3);
  const historico = [];
  let preco = precoAtual;
  const pubDate = new Date(dataPublicacao);
  for (let i = entradas - 1; i >= 0; i--) {
    const d = new Date(pubDate);
    d.setDate(d.getDate() + i * intBetween(15, 40));
    if (d > new Date()) d.setTime(Date.now());
    historico.push({ date: d.toISOString().slice(0, 10), price: Math.round(preco) });
    preco = preco * between(0.96, 1.05);
  }
  historico.reverse();
  historico[historico.length - 1].price = Math.round(precoAtual);
  return historico;
}

let seq = 1;
const imoveis = [];

for (const bairro of BAIRROS) {
  for (let i = 0; i < bairro.count; i++) {
    const tipo = sortearTipo();
    const faixa = FAIXAS[tipo];
    const area = Math.round(between(faixa.areaMin, faixa.areaMax));
    const precoM2 = between(faixa.precoM2Min, faixa.precoM2Max);
    const precoVendaBase = Math.round((area * precoM2) / 1000) * 1000;

    const id = `morai-demo-${String(seq).padStart(3, "0")}`;
    seq++;

    const coords = jitterCoord(bairro.lat, bairro.lng, bairro.raioKm);
    const endereco = `${pick(RUAS)}, ${intBetween(10, 1400)} - ${bairro.nome}, ${bairro.cidade} - PE`;

    const semQuartos = tipo === "terreno" || tipo === "comercial";
    const quartos = semQuartos ? 0 : tipo === "kitnet" ? 1 : intBetween(1, 5);
    const suites = quartos > 1 ? intBetween(0, Math.min(2, quartos - 1)) : 0;
    const banheiros =
      tipo === "terreno" ? 0 : tipo === "comercial" ? intBetween(1, 3) : Math.max(1, quartos - intBetween(0, 1));
    const vagas = tipo === "terreno" ? 0 : intBetween(0, 3);

    const dataPublicacao = diasAtras(1, 120);
    const status = chance(0.08) ? "reservado" : "disponivel";

    const caracteristicas = gerarCaracteristicas(tipo);

    const titulo = `${pick(TITULOS[tipo])} em ${bairro.nome}`;
    const descExtraPool = bairro.cidade === "Recife" ? DESCRICOES_EXTRA_RECIFE : DESCRICOES_EXTRA_OLINDA;
    const descricao = `Imóvel demonstrativo do tipo ${tipo.replace("_", " ")} com ${area} m², localizado no bairro ${bairro.nome}, ${pick(descExtraPool)}`;

    const isAluguel = seq % 20 < 9; // ~45% aluguel ao longo da sequência, ajustado abaixo

    let finalidade = isAluguel ? "aluguel" : "venda";
    let preco;
    if (finalidade === "venda") {
      preco = precoVendaBase;
    } else {
      // aluguel mensal: aproximação de 0.45%-0.7% do valor de venda equivalente
      preco = Math.round((precoVendaBase * between(0.0045, 0.007)) / 50) * 50;
    }

    const condominio = ["apartamento", "cobertura", "casa_condominio"].includes(tipo)
      ? Math.round(between(150, 950) / 10) * 10
      : 0;
    const iptuMensal = tipo === "terreno" ? Math.round(area * between(0.8, 1.6)) : Math.round(between(35, 320));

    const precoM2Final = tipo === "terreno" || finalidade === "venda" ? Math.round((preco / area) * 100) / 100 : Math.round((preco / area) * 100) / 100;

    imoveis.push({
      id,
      demo: true,
      titulo,
      descricao,
      finalidade,
      tipo,
      preco,
      condominio,
      iptuMensal,
      area,
      precoM2: precoM2Final,
      quartos,
      suites,
      banheiros,
      vagas,
      bairro: bairro.nome,
      endereco,
      lat: Math.round(coords.lat * 1e6) / 1e6,
      lng: Math.round(coords.lng * 1e6) / 1e6,
      fotos: gerarFotos(tipo, intBetween(4, 6)),
      caracteristicas,
      dataPublicacao,
      historicoPrecos: gerarHistoricoPrecos(preco, dataPublicacao),
      status,
    });
  }
}

// Ajuste final pra manter a proporção ~55% venda / 45% aluguel conforme especificação,
// qualquer que seja o total (cresce quando novos bairros são adicionados)
const vendaAtual = imoveis.filter((i) => i.finalidade === "venda").length;
const alvoVenda = Math.round(TOTAL * 0.55);
if (vendaAtual !== alvoVenda) {
  const diff = alvoVenda - vendaAtual;
  if (diff > 0) {
    // precisa converter alguns de aluguel -> venda
    const candidatos = imoveis.filter((i) => i.finalidade === "aluguel" && i.tipo !== "terreno");
    for (let i = 0; i < diff && i < candidatos.length; i++) {
      const im = candidatos[i];
      im.finalidade = "venda";
      const faixa = FAIXAS[im.tipo];
      const precoM2 = between(faixa.precoM2Min, faixa.precoM2Max);
      im.preco = Math.round((im.area * precoM2) / 1000) * 1000;
      im.precoM2 = Math.round((im.preco / im.area) * 100) / 100;
      im.historicoPrecos = gerarHistoricoPrecos(im.preco, im.dataPublicacao);
    }
  } else {
    const candidatos = imoveis.filter((i) => i.finalidade === "venda" && i.tipo !== "terreno");
    for (let i = 0; i < -diff && i < candidatos.length; i++) {
      const im = candidatos[i];
      im.finalidade = "aluguel";
      im.preco = Math.round((im.preco * between(0.0045, 0.007)) / 50) * 50;
      im.precoM2 = Math.round((im.preco / im.area) * 100) / 100;
      im.historicoPrecos = gerarHistoricoPrecos(im.preco, im.dataPublicacao);
    }
  }
}

if (imoveis.length !== TOTAL) {
  throw new Error(`Esperado ${TOTAL} imóveis, gerado ${imoveis.length}`);
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(imoveis, null, 2));

const vendaFinal = imoveis.filter((i) => i.finalidade === "venda").length;
const aluguelFinal = imoveis.filter((i) => i.finalidade === "aluguel").length;
console.log(`Gerados ${imoveis.length} imóveis demonstrativos em ${OUT_PATH}`);
console.log(`Venda: ${vendaFinal} | Aluguel: ${aluguelFinal}`);
for (const b of BAIRROS) {
  console.log(`  ${b.nome}: ${b.count}`);
}
