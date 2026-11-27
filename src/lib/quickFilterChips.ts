import type { LucideIcon } from "lucide-react";
import { Home, Tag, Ruler, BedDouble, Bath, Car, PawPrint, ShieldCheck, Waves, DoorOpen, TreePine, ArrowUpDown, Accessibility, Armchair, Sparkles } from "lucide-react";
import type { Filters } from "@/lib/store/useAppStore";
import { formatCompactPrice, labelTipo } from "@/lib/format";

export interface QuickFilterChip {
  key: string;
  icon: LucideIcon;
  label: string;
  /** Patch aplicado via setFilters pra remover só esse filtro, sem afetar os demais. */
  remove: Partial<Filters>;
}

/** Deriva as cápsulas de "filtros ativos" a partir do estado de filtros — pedido explícito do
 * briefing de direção de arte: "os filtros precisam ser funcionais [...], não devem ser apenas
 * elementos decorativos". Cada cápsula remove só o próprio critério ao ser fechada. */
export function buildQuickFilterChips(filters: Filters): QuickFilterChip[] {
  const chips: QuickFilterChip[] = [];

  if (filters.tipos.length > 0) {
    chips.push({
      key: "tipos",
      icon: Home,
      label: filters.tipos.length === 1 ? labelTipo(filters.tipos[0]) : `${filters.tipos.length} tipos`,
      remove: { tipos: [] },
    });
  }
  if (filters.precoMax !== null) {
    chips.push({
      key: "precoMax",
      icon: Tag,
      label: `${filters.finalidade === "aluguel" ? "Aluguel" : "Preço"} até ${formatCompactPrice(filters.precoMax)}`,
      remove: { precoMax: null },
    });
  }
  if (filters.precoMin !== null) {
    chips.push({
      key: "precoMin",
      icon: Tag,
      label: `A partir de ${formatCompactPrice(filters.precoMin)}`,
      remove: { precoMin: null },
    });
  }
  if (filters.areaMin !== null) {
    chips.push({ key: "areaMin", icon: Ruler, label: `${filters.areaMin}+ m²`, remove: { areaMin: null } });
  }
  if (filters.quartosMin !== null) {
    chips.push({
      key: "quartosMin",
      icon: BedDouble,
      label: `${filters.quartosMin}+ quartos`,
      remove: { quartosMin: null },
    });
  }
  if (filters.suitesMin !== null) {
    chips.push({ key: "suitesMin", icon: BedDouble, label: `${filters.suitesMin}+ suítes`, remove: { suitesMin: null } });
  }
  if (filters.banheirosMin !== null) {
    chips.push({
      key: "banheirosMin",
      icon: Bath,
      label: `${filters.banheirosMin}+ banheiros`,
      remove: { banheirosMin: null },
    });
  }
  if (filters.vagasMin !== null) {
    chips.push({ key: "vagasMin", icon: Car, label: "Garagem", remove: { vagasMin: null } });
  }
  if (filters.aceitaAnimais) {
    chips.push({ key: "aceitaAnimais", icon: PawPrint, label: "Pet permitido", remove: { aceitaAnimais: false } });
  }
  if (filters.condominioFechado) {
    chips.push({
      key: "condominioFechado",
      icon: ShieldCheck,
      label: "Condomínio fechado",
      remove: { condominioFechado: false },
    });
  }
  if (filters.piscina) {
    chips.push({ key: "piscina", icon: Waves, label: "Piscina", remove: { piscina: false } });
  }
  if (filters.varanda) {
    chips.push({ key: "varanda", icon: DoorOpen, label: "Varanda", remove: { varanda: false } });
  }
  if (filters.quintal) {
    chips.push({ key: "quintal", icon: TreePine, label: "Quintal", remove: { quintal: false } });
  }
  if (filters.elevador) {
    chips.push({ key: "elevador", icon: ArrowUpDown, label: "Elevador", remove: { elevador: false } });
  }
  if (filters.acessibilidade) {
    chips.push({ key: "acessibilidade", icon: Accessibility, label: "Acessibilidade", remove: { acessibilidade: false } });
  }
  if (filters.mobiliado) {
    chips.push({ key: "mobiliado", icon: Armchair, label: "Mobiliado", remove: { mobiliado: false } });
  }
  if (filters.apenasOportunidades) {
    chips.push({
      key: "apenasOportunidades",
      icon: Sparkles,
      label: "Só oportunidades",
      remove: { apenasOportunidades: false },
    });
  }

  return chips;
}
