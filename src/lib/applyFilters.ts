import type { Property, RadarResult } from "@/lib/types";
import type { Filters } from "@/lib/store/useAppStore";
import { isOportunidade } from "@/lib/radar";

export function applyFilters(
  properties: Property[],
  filters: Filters,
  radarById?: Record<string, RadarResult>,
): Property[] {
  return properties.filter((p) => {
    if (p.finalidade !== filters.finalidade) return false;
    if (filters.tipos.length > 0 && !filters.tipos.includes(p.tipo)) return false;
    if (filters.precoMin !== null && p.preco < filters.precoMin) return false;
    if (filters.precoMax !== null && p.preco > filters.precoMax) return false;
    if (filters.areaMin !== null && p.area < filters.areaMin) return false;
    if (filters.quartosMin !== null && p.quartos < filters.quartosMin) return false;
    if (filters.suitesMin !== null && p.suites < filters.suitesMin) return false;
    if (filters.banheirosMin !== null && p.banheiros < filters.banheirosMin) return false;
    if (filters.vagasMin !== null && p.vagas < filters.vagasMin) return false;
    if (filters.aceitaAnimais && !p.caracteristicas.aceitaAnimais) return false;
    if (filters.condominioFechado && !p.caracteristicas.condominioFechado) return false;
    if (filters.piscina && !p.caracteristicas.piscina) return false;
    if (filters.varanda && !p.caracteristicas.varanda) return false;
    if (filters.quintal && !p.caracteristicas.quintal) return false;
    if (filters.elevador && !p.caracteristicas.elevador) return false;
    if (filters.acessibilidade && !p.caracteristicas.acessibilidade) return false;
    if (filters.mobiliado && !p.caracteristicas.mobiliado) return false;
    if (filters.apenasOportunidades) {
      const radar = radarById?.[p.id];
      if (!radar || !isOportunidade(radar)) return false;
    }
    return true;
  });
}

export function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.tipos.length > 0) count++;
  if (filters.precoMin !== null) count++;
  if (filters.precoMax !== null) count++;
  if (filters.areaMin !== null) count++;
  if (filters.quartosMin !== null) count++;
  if (filters.suitesMin !== null) count++;
  if (filters.banheirosMin !== null) count++;
  if (filters.vagasMin !== null) count++;
  if (filters.aceitaAnimais) count++;
  if (filters.condominioFechado) count++;
  if (filters.piscina) count++;
  if (filters.varanda) count++;
  if (filters.quintal) count++;
  if (filters.elevador) count++;
  if (filters.acessibilidade) count++;
  if (filters.mobiliado) count++;
  if (filters.apenasOportunidades) count++;
  return count;
}
