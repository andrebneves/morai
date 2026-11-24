// Envia os 100 imóveis demonstrativos (src/lib/data/properties.json) para o Supabase.
// Requer as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// (a service role key, NUNCA a anon key, para poder gravar ignorando RLS).
// Uso: npm run seed:push
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.\n" +
      "Ver DATABASE.md para instruções.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const properties = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "src", "lib", "data", "properties.json"), "utf8"),
);

function toRow(p) {
  return {
    id: p.id,
    demo: true,
    titulo: p.titulo,
    descricao: p.descricao,
    finalidade: p.finalidade,
    tipo: p.tipo,
    preco: p.preco,
    condominio: p.condominio,
    iptu_mensal: p.iptuMensal,
    area: p.area,
    preco_m2: p.precoM2,
    quartos: p.quartos,
    suites: p.suites,
    banheiros: p.banheiros,
    vagas: p.vagas,
    bairro: p.bairro,
    endereco: p.endereco,
    lat: p.lat,
    lng: p.lng,
    fotos: p.fotos,
    caracteristicas: p.caracteristicas,
    data_publicacao: p.dataPublicacao,
    historico_precos: p.historicoPrecos,
    status: p.status,
  };
}

async function main() {
  const rows = properties.map(toRow);
  const chunkSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("properties").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("Erro ao inserir lote:", error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Enviados ${inserted}/${rows.length}`);
  }

  console.log("Seed enviado ao Supabase com sucesso.");
}

main();
