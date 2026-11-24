import type { Property, RadarClassification, RadarResult } from "@/lib/types";

const AMOSTRA_MINIMA = 4;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function classify(diffPct: number): RadarClassification {
  if (diffPct <= -15) return "muito_abaixo";
  if (diffPct <= -5) return "abaixo";
  if (diffPct < 5) return "dentro";
  if (diffPct < 15) return "acima";
  return "muito_acima";
}

/**
 * Compara um imóvel com imóveis do mesmo tipo, mesma finalidade e mesmo bairro
 * para estimar uma referência demonstrativa de preço por m².
 * Nunca opera sobre dados reais de mercado — todo o dataset inicial é fictício.
 */
export function calcularRadar(
  imovel: Property,
  universo: Property[],
): RadarResult {
  const comparaveis = universo.filter(
    (p) =>
      p.id !== imovel.id &&
      p.tipo === imovel.tipo &&
      p.finalidade === imovel.finalidade &&
      p.bairro === imovel.bairro &&
      p.status !== "indisponivel",
  );

  if (comparaveis.length < AMOSTRA_MINIMA) {
    return {
      classificacao: "insuficiente",
      precoM2: imovel.precoM2,
      medianaM2: 0,
      diferencaPercentual: null,
      amostraUtilizada: comparaveis.length,
      demonstrativo: true,
    };
  }

  const medianaM2 = median(comparaveis.map((p) => p.precoM2));
  const diferencaPercentual = ((imovel.precoM2 - medianaM2) / medianaM2) * 100;

  return {
    classificacao: classify(diferencaPercentual),
    precoM2: imovel.precoM2,
    medianaM2: Math.round(medianaM2 * 100) / 100,
    diferencaPercentual: Math.round(diferencaPercentual * 10) / 10,
    amostraUtilizada: comparaveis.length,
    demonstrativo: true,
  };
}

export const RADAR_LABELS: Record<RadarClassification, string> = {
  muito_abaixo: "Muito abaixo da referência",
  abaixo: "Abaixo da referência",
  dentro: "Dentro da referência",
  acima: "Acima da referência",
  muito_acima: "Muito acima da referência",
  insuficiente: "Amostra insuficiente",
};

export const RADAR_AVISO =
  "Referência demonstrativa — não representa o mercado real.";

export function isOportunidade(r: RadarResult): boolean {
  return r.classificacao === "muito_abaixo" || r.classificacao === "abaixo";
}
