export type ListingPurpose = "venda" | "aluguel";

export type PropertyType =
  | "casa"
  | "apartamento"
  | "casa_condominio"
  | "cobertura"
  | "kitnet"
  | "terreno"
  | "comercial";

export type AvailabilityStatus = "disponivel" | "reservado" | "indisponivel" | "pendente";

export interface PriceHistoryEntry {
  date: string;
  price: number;
}

export interface PropertyFeatures {
  aceitaAnimais: boolean;
  condominioFechado: boolean;
  piscina: boolean;
  varanda: boolean;
  quintal: boolean;
  elevador: boolean;
  acessibilidade: boolean;
  mobiliado: boolean;
}

export interface Property {
  id: string;
  /** true para os 100 imóveis demonstrativos do seed; false para cadastros reais de usuários */
  demo: boolean;
  titulo: string;
  descricao: string;
  finalidade: ListingPurpose;
  tipo: PropertyType;
  preco: number;
  condominio: number;
  iptuMensal: number;
  area: number;
  precoM2: number;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  bairro: string;
  endereco: string;
  lat: number;
  lng: number;
  /** contato informado pelo anunciante (apenas para cadastros reais, não-demo) */
  contato?: string;
  fotos: string[];
  caracteristicas: PropertyFeatures;
  dataPublicacao: string;
  historicoPrecos: PriceHistoryEntry[];
  status: AvailabilityStatus;
}

export interface NeighborhoodCenter {
  nome: string;
  lat: number;
  lng: number;
  raioKm: number;
}

export type RadarClassification =
  | "muito_abaixo"
  | "abaixo"
  | "dentro"
  | "acima"
  | "muito_acima"
  | "insuficiente";

export interface RadarResult {
  classificacao: RadarClassification;
  precoM2: number;
  medianaM2: number;
  diferencaPercentual: number | null;
  amostraUtilizada: number;
  demonstrativo: true;
}

export type POICategory =
  | "farmacia"
  | "supermercado"
  | "mercadinho"
  | "padaria"
  | "escola"
  | "creche"
  | "hospital"
  | "clinica"
  | "academia"
  | "restaurante"
  | "cafeteria"
  | "shopping"
  | "ponto_onibus"
  | "ponto_taxi"
  | "posto_combustivel"
  | "banco"
  | "praca"
  | "parque"
  | "praia"
  | "pet_shop"
  | "veterinario"
  | "estacionamento";

export interface POI {
  id: string;
  categoria: POICategory;
  nome: string;
  lat: number;
  lng: number;
  distanciaMetros: number;
}

export interface FeedbackEntry {
  id: string;
  createdAt: string;
  tipo: "sugestao" | "erro" | "localizacao" | "instalacao" | "funcionalidade";
  nota?: number;
  mensagem: string;
}
