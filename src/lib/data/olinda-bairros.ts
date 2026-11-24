import type { NeighborhoodCenter } from "@/lib/types";

/**
 * Centros geográficos reais dos bairros de Olinda/PE, obtidos via geocodificação
 * OpenStreetMap/Nominatim (nov/2026). Usados para distribuir os imóveis demonstrativos
 * e para centralizar buscas por bairro no mapa.
 */
export const OLINDA_CENTER = { lat: -7.9936, lng: -34.8456 };

export const OLINDA_BAIRROS: NeighborhoodCenter[] = [
  { nome: "Bairro Novo", lat: -8.0021881, lng: -34.8426716, raioKm: 0.9 },
  { nome: "Casa Caiada", lat: -7.9846571, lng: -34.8383477, raioKm: 0.8 },
  { nome: "Jardim Atlântico", lat: -7.9743534, lng: -34.8426801, raioKm: 0.9 },
  { nome: "Rio Doce", lat: -7.96569, lng: -34.8317257, raioKm: 0.8 },
  { nome: "Carmo", lat: -8.0169124, lng: -34.8490134, raioKm: 0.5 },
  { nome: "Bonsucesso", lat: -8.0102502, lng: -34.8526796, raioKm: 0.5 },
  { nome: "Amparo", lat: -8.0120938, lng: -34.8545333, raioKm: 0.4 },
  { nome: "Varadouro", lat: -8.019138, lng: -34.8541721, raioKm: 0.5 },
  { nome: "Guadalupe", lat: -8.0076592, lng: -34.8555142, raioKm: 0.4 },
  { nome: "Bultrins", lat: -7.9995002, lng: -34.8501475, raioKm: 0.4 },
  { nome: "Fragoso", lat: -7.9837784, lng: -34.8537899, raioKm: 0.7 },
  { nome: "Ouro Preto", lat: -7.9938659, lng: -34.8597123, raioKm: 0.8 },
  { nome: "Jardim Brasil", lat: -8.0050198, lng: -34.8681399, raioKm: 0.7 },
  { nome: "Peixinhos", lat: -8.0137705, lng: -34.87208, raioKm: 0.6 },
  { nome: "Sítio Novo", lat: -8.0266692, lng: -34.8743755, raioKm: 0.4 },
  { nome: "Cidade Tabajara", lat: -7.9770241, lng: -34.8657206, raioKm: 0.5 },
  { nome: "Águas Compridas", lat: -7.9906074, lng: -34.8976237, raioKm: 0.5 },
];

export function findBairro(nome: string): NeighborhoodCenter | undefined {
  return OLINDA_BAIRROS.find(
    (b) => b.nome.toLowerCase() === nome.toLowerCase(),
  );
}
