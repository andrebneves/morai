export type SistemaAmortizacao = "SAC" | "PRICE";

export interface SimulacaoFinanciamento {
  valorFinanciado: number;
  parcelaPrimeira: number;
  parcelaUltima: number;
  totalEstimado: number;
  parcelas: number[];
}

/**
 * Simulação simplificada de financiamento (SAC ou Price). Não representa uma
 * proposta bancária nem aprovação de crédito — apenas uma estimativa educativa.
 */
export function simularFinanciamento({
  valorImovel,
  entrada,
  prazoMeses,
  taxaJurosAnual,
  sistema,
}: {
  valorImovel: number;
  entrada: number;
  prazoMeses: number;
  taxaJurosAnual: number;
  sistema: SistemaAmortizacao;
}): SimulacaoFinanciamento {
  const valorFinanciado = Math.max(valorImovel - entrada, 0);
  const i = Math.pow(1 + taxaJurosAnual / 100, 1 / 12) - 1;

  if (valorFinanciado === 0 || prazoMeses <= 0) {
    return { valorFinanciado: 0, parcelaPrimeira: 0, parcelaUltima: 0, totalEstimado: 0, parcelas: [] };
  }

  const parcelas: number[] = [];

  if (sistema === "PRICE") {
    const parcela =
      i === 0
        ? valorFinanciado / prazoMeses
        : (valorFinanciado * (i * Math.pow(1 + i, prazoMeses))) / (Math.pow(1 + i, prazoMeses) - 1);
    for (let k = 0; k < prazoMeses; k++) parcelas.push(parcela);
  } else {
    const amortizacao = valorFinanciado / prazoMeses;
    let saldo = valorFinanciado;
    for (let k = 0; k < prazoMeses; k++) {
      const juros = saldo * i;
      parcelas.push(amortizacao + juros);
      saldo -= amortizacao;
    }
  }

  const totalEstimado = parcelas.reduce((sum, p) => sum + p, 0) + entrada;

  return {
    valorFinanciado,
    parcelaPrimeira: parcelas[0],
    parcelaUltima: parcelas[parcelas.length - 1],
    totalEstimado,
    parcelas,
  };
}

export interface CustoMensal {
  base: number; // aluguel ou prestação
  condominio: number;
  iptuMensal: number;
  agua: number;
  energia: number;
  internet: number;
  seguro: number;
  transporte: number;
  outras: number;
}

export function totalCustoMensal(c: CustoMensal): number {
  return (
    c.base + c.condominio + c.iptuMensal + c.agua + c.energia + c.internet + c.seguro + c.transporte + c.outras
  );
}
