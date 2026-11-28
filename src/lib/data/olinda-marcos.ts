/**
 * Marcos históricos reais de Olinda/PE, com coordenadas verificadas cruzando múltiplas fontes
 * independentes (Wikidata, Wikipédia em português, Mapcarta) — nunca inventadas (ver
 * "Direção de arte" em DESIGN_SYSTEM.md e a regra geral do projeto de nunca alterar geografia
 * real). Renderizados no mapa como ícone + rótulo (sem fundo/pill), igual ao briefing visual.
 *
 * - Catedral da Sé de Olinda: -8°00'50"S, 34°50'57"O (Wikidata Q10376080 / Wikipédia).
 * - Alto da Sé: -8°00'49"S, 34°51'01"O (Wikidata Q46994631 / Mapcarta).
 * - Mosteiro de São Bento de Olinda: -8°01'12"S, 34°51'07"O (Wikipédia em português).
 * - Forte de São Francisco (Fortim do Queijo): -8°00'55"S, 34°50'49"O (Wikidata Q10284250).
 */
export type MarcoIcone = "igreja" | "mirante" | "mosteiro" | "forte";

export interface Marco {
  nome: string;
  lat: number;
  lng: number;
  icone: MarcoIcone;
}

export const OLINDA_MARCOS: Marco[] = [
  { nome: "Catedral da Sé de Olinda", lat: -8.0139, lng: -34.8491, icone: "igreja" },
  { nome: "Alto da Sé", lat: -8.0136, lng: -34.85, icone: "mirante" },
  { nome: "Mosteiro de São Bento de Olinda", lat: -8.02, lng: -34.8519, icone: "mosteiro" },
  { nome: "Forte de São Francisco", lat: -8.0153, lng: -34.8469, icone: "forte" },
];
