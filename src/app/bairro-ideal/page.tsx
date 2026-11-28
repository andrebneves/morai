"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { OLINDA_BAIRROS } from "@/lib/data/olinda-bairros";
import { getAllProperties } from "@/lib/data/properties";
import type { POICategory, Property } from "@/lib/types";
import { fetchNearbyPOIs } from "@/lib/overpass";

interface Prioridade {
  key: string;
  label: string;
  poiCategoria?: POICategory;
  featureKey?: keyof Property["caracteristicas"];
}

const PRIORIDADES: Prioridade[] = [
  { key: "escola", label: "Escola próxima", poiCategoria: "escola" },
  { key: "farmacia", label: "Farmácia próxima", poiCategoria: "farmacia" },
  { key: "supermercado", label: "Supermercado próximo", poiCategoria: "supermercado" },
  { key: "padaria", label: "Padaria próxima", poiCategoria: "padaria" },
  { key: "praia", label: "Praia próxima", poiCategoria: "praia" },
  { key: "academia", label: "Academia próxima", poiCategoria: "academia" },
  { key: "hospital", label: "Hospital próximo", poiCategoria: "hospital" },
  { key: "transporte", label: "Transporte público próximo", poiCategoria: "ponto_onibus" },
  { key: "animais", label: "Aceita animais", featureKey: "aceitaAnimais" },
  { key: "quintal", label: "Quintal", featureKey: "quintal" },
  { key: "condominio", label: "Condomínio fechado", featureKey: "condominioFechado" },
];

const DISTANCIAS = [
  { value: 500, label: "Até 500 m" },
  { value: 1000, label: "Até 1 km" },
  { value: 2000, label: "Até 2 km" },
];

interface ResultadoBairro {
  nome: string;
  pontuacao: number;
  detalhes: { label: string; atendido: boolean; descricao: string }[];
}

export default function BairroIdealPage() {
  const router = useRouter();
  const [selecionadas, setSelecionadas] = useState<string[]>(["escola", "supermercado", "praia"]);
  const [distancia, setDistancia] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBairro[] | null>(null);
  const [poiIndisponivel, setPoiIndisponivel] = useState(false);

  const toggle = (key: string) =>
    setSelecionadas((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const calcular = async () => {
    if (selecionadas.length === 0) return;
    setLoading(true);

    const criterios = PRIORIDADES.filter((p) => selecionadas.includes(p.key));
    const poiCriterios = criterios.filter((c) => c.poiCategoria);
    const featureCriterios = criterios.filter((c) => c.featureKey);

    const allProperties = await getAllProperties();

    const categoriasUnicas = Array.from(new Set(poiCriterios.map((c) => c.poiCategoria!)));

    const resultadosCalculados: ResultadoBairro[] = [];
    let falhasPoi = 0;

    for (const bairro of OLINDA_BAIRROS) {
      const detalhes: ResultadoBairro["detalhes"] = [];
      let atendidos = 0;

      if (poiCriterios.length > 0) {
        try {
          const data = await fetchNearbyPOIs(bairro.lat, bairro.lng, distancia, categoriasUnicas);
          const pois = data.pois;
          if (data.aviso) falhasPoi++;

          for (const c of poiCriterios) {
            const encontrado = pois.some((p) => p.categoria === c.poiCategoria);
            if (encontrado) atendidos++;
            detalhes.push({
              label: c.label,
              atendido: encontrado,
              descricao: encontrado ? `Encontrado em até ${distancia}m` : "Nenhum encontrado no raio escolhido",
            });
          }
        } catch {
          falhasPoi++;
          for (const c of poiCriterios) {
            detalhes.push({ label: c.label, atendido: false, descricao: "Não foi possível verificar agora" });
          }
        }
      }

      const imoveisDoBairro = allProperties.filter((p) => p.bairro === bairro.nome);
      for (const c of featureCriterios) {
        if (imoveisDoBairro.length === 0) {
          detalhes.push({ label: c.label, atendido: false, descricao: "Sem imóveis demonstrativos no bairro" });
          continue;
        }
        const fracao =
          imoveisDoBairro.filter((p) => p.caracteristicas[c.featureKey!]).length / imoveisDoBairro.length;
        const atendido = fracao >= 0.4;
        if (atendido) atendidos++;
        detalhes.push({
          label: c.label,
          atendido,
          descricao: `${Math.round(fracao * 100)}% dos imóveis demonstrativos do bairro`,
        });
      }

      const pontuacao = Math.round((atendidos / criterios.length) * 100);
      resultadosCalculados.push({ nome: bairro.nome, pontuacao, detalhes });
    }

    resultadosCalculados.sort((a, b) => b.pontuacao - a.pontuacao);
    setResultados(resultadosCalculados);
    setPoiIndisponivel(poiCriterios.length > 0 && falhasPoi === OLINDA_BAIRROS.length);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="flex items-center gap-3 px-5 pt-safe pb-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Meu Bairro Ideal</h1>
      </div>

      <div className="space-y-5 px-5">
        <p className="text-sm text-text-muted">
          Escolha o que é importante para você e descubra quais bairros de Olinda mais combinam, com base
          em dados abertos do OpenStreetMap e nos imóveis demonstrativos do Moraí.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-muted">Prioridades</h2>
          <div className="flex flex-wrap gap-2">
            {PRIORIDADES.map((p) => (
              <Chip key={p.key} active={selecionadas.includes(p.key)} onClick={() => toggle(p.key)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-muted">Distância desejada (para itens no mapa)</h2>
          <div className="flex gap-2">
            {DISTANCIAS.map((d) => (
              <Chip key={d.value} active={distancia === d.value} onClick={() => setDistancia(d.value)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </section>

        <Button fullWidth size="lg" onClick={calcular} disabled={loading || selecionadas.length === 0}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular compatibilidade"}
        </Button>

        {resultados && (
          <section className="space-y-3 pt-2">
            {poiIndisponivel && (
              <div className="flex items-start gap-2 rounded-xl bg-warning/15 p-3 text-xs text-warning">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Não foi possível consultar os pontos de interesse agora (OpenStreetMap indisponível). As
                  pontuações abaixo não refletem os critérios de proximidade — tente novamente mais tarde.
                </p>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-xl bg-surface-muted p-3 text-xs text-text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                A pontuação considera apenas os critérios selecionados. Itens não verificáveis não são
                contados como atendidos.
              </p>
            </div>
            {resultados.map((r) => (
              <details key={r.nome} className="rounded-2xl border border-border-subtle p-4">
                <summary className="flex cursor-pointer items-center justify-between">
                  <span className="font-semibold">{r.nome}</span>
                  <span className="text-lg font-extrabold text-emerald">{r.pontuacao}%</span>
                </summary>
                <div className="mt-3 space-y-1.5">
                  {r.detalhes.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <span className={d.atendido ? "" : "text-text-muted"}>{d.label}</span>
                      <span className={d.atendido ? "font-semibold text-emerald" : "text-text-muted"}>
                        {d.descricao}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
