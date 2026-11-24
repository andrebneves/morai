import type { Property } from "@/lib/types";
import seedData from "@/lib/data/properties.json";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const SEED: Property[] = seedData as Property[];
const LOCAL_SUBMISSIONS_KEY = "morai:local-submissions:v1";

function readLocalSubmissions(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    return raw ? (JSON.parse(raw) as Property[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalSubmission(property: Property) {
  if (typeof window === "undefined") return;
  const current = readLocalSubmissions();
  current.unshift(property);
  window.localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(current));
}

function fromSupabaseRow(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    demo: Boolean(row.demo),
    titulo: row.titulo as string,
    descricao: row.descricao as string,
    finalidade: row.finalidade as Property["finalidade"],
    tipo: row.tipo as Property["tipo"],
    preco: Number(row.preco),
    condominio: Number(row.condominio ?? 0),
    iptuMensal: Number(row.iptu_mensal ?? 0),
    area: Number(row.area),
    precoM2: Number(row.preco_m2 ?? Number(row.preco) / Number(row.area)),
    quartos: Number(row.quartos ?? 0),
    suites: Number(row.suites ?? 0),
    banheiros: Number(row.banheiros ?? 0),
    vagas: Number(row.vagas ?? 0),
    bairro: row.bairro as string,
    endereco: row.endereco as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    fotos: (row.fotos as string[]) ?? [],
    caracteristicas: (row.caracteristicas as Property["caracteristicas"]) ?? {
      aceitaAnimais: false,
      condominioFechado: false,
      piscina: false,
      varanda: false,
      quintal: false,
      elevador: false,
      acessibilidade: false,
      mobiliado: false,
    },
    dataPublicacao: (row.data_publicacao as string) ?? new Date().toISOString().slice(0, 10),
    historicoPrecos: (row.historico_precos as Property["historicoPrecos"]) ?? [
      { date: new Date().toISOString().slice(0, 10), price: Number(row.preco) },
    ],
    status: (row.status as Property["status"]) ?? "disponivel",
  };
}

/**
 * Repositório de imóveis. Enquanto o Supabase não estiver configurado
 * (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY ausentes), o app funciona inteiramente
 * com os 100 imóveis demonstrativos locais + cadastros feitos neste dispositivo.
 * Quando o Supabase estiver configurado, os imóveis aprovados no banco
 * compartilhado substituem/complementam o dataset local.
 */
export async function getAllProperties(): Promise<Property[]> {
  const local = [...readLocalSubmissions(), ...SEED];

  if (!isSupabaseConfigured()) {
    return local;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return local;

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "disponivel")
    .order("data_publicacao", { ascending: false });

  if (error || !data) return local;

  const remote = data.map(fromSupabaseRow);
  return remote.length > 0 ? remote : local;
}

export function getSeedProperties(): Property[] {
  return SEED;
}
