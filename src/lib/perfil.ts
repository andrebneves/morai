import type { PerfilDesejaveis, PerfilObrigatorios, Property, RadarResult } from "@/lib/types";
import { isOportunidade } from "@/lib/radar";

/** Verifica os critérios obrigatórios de um perfil de busca — qualquer um que falhe exclui o
 * imóvel por completo (nunca aparece na lista de proximidade nem gera alerta). */
export function atendeObrigatorios(p: Property, o: PerfilObrigatorios): boolean {
  if (p.finalidade !== o.finalidade) return false;
  if (o.tipos.length > 0 && !o.tipos.includes(p.tipo)) return false;
  if (o.precoMax !== null && p.preco > o.precoMax) return false;
  if (o.areaMin !== null && p.area < o.areaMin) return false;
  if (o.quartosMin !== null && p.quartos < o.quartosMin) return false;
  if (o.vagasMin !== null && p.vagas < o.vagasMin) return false;
  if (o.aceitaAnimais && !p.caracteristicas.aceitaAnimais) return false;
  if (o.condominioFechado && !p.caracteristicas.condominioFechado) return false;
  if (o.piscina && !p.caracteristicas.piscina) return false;
  if (o.varanda && !p.caracteristicas.varanda) return false;
  if (o.quintal && !p.caracteristicas.quintal) return false;
  if (o.elevador && !p.caracteristicas.elevador) return false;
  if (o.acessibilidade && !p.caracteristicas.acessibilidade) return false;
  if (o.mobiliado && !p.caracteristicas.mobiliado) return false;
  return true;
}

/** % de compatibilidade com as preferências desejáveis (não exclui, só pontua). Retorna `null`
 * quando o perfil não marcou nenhuma preferência desejável — não há o que calcular. */
export function calcularCompatibilidade(
  p: Property,
  d: PerfilDesejaveis,
  radar: RadarResult | undefined,
): number | null {
  const criterios: boolean[] = [];
  if (d.apenasOportunidades) criterios.push(Boolean(radar && isOportunidade(radar)));
  if (d.aceitaAnimais) criterios.push(p.caracteristicas.aceitaAnimais);
  if (d.condominioFechado) criterios.push(p.caracteristicas.condominioFechado);
  if (d.piscina) criterios.push(p.caracteristicas.piscina);
  if (d.varanda) criterios.push(p.caracteristicas.varanda);
  if (d.quintal) criterios.push(p.caracteristicas.quintal);
  if (d.elevador) criterios.push(p.caracteristicas.elevador);
  if (d.acessibilidade) criterios.push(p.caracteristicas.acessibilidade);
  if (d.mobiliado) criterios.push(p.caracteristicas.mobiliado);
  if (criterios.length === 0) return null;
  const atendidos = criterios.filter(Boolean).length;
  return Math.round((atendidos / criterios.length) * 100);
}

export const DEFAULT_OBRIGATORIOS: PerfilObrigatorios = {
  finalidade: "venda",
  tipos: [],
  precoMax: null,
  areaMin: null,
  quartosMin: null,
  vagasMin: null,
  aceitaAnimais: false,
  condominioFechado: false,
  piscina: false,
  varanda: false,
  quintal: false,
  elevador: false,
  acessibilidade: false,
  mobiliado: false,
};

export const DEFAULT_DESEJAVEIS: PerfilDesejaveis = {
  apenasOportunidades: true,
  aceitaAnimais: false,
  condominioFechado: false,
  piscina: false,
  varanda: false,
  quintal: false,
  elevador: false,
  acessibilidade: false,
  mobiliado: false,
};
