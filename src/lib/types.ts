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

export type RaioPasseio = 100 | 250 | 500 | 1000 | 2000;
export type ModoDeslocamento = "pe" | "carro";

/** Critérios obrigatórios de um perfil de busca do Modo Passeio — um imóvel que não atenda a
 * algum deles nunca aparece na lista de proximidade nem gera alerta, mesmo dentro do raio. */
export interface PerfilObrigatorios {
  finalidade: ListingPurpose;
  tipos: PropertyType[];
  precoMax: number | null;
  areaMin: number | null;
  quartosMin: number | null;
  vagasMin: number | null;
  aceitaAnimais: boolean;
  condominioFechado: boolean;
  piscina: boolean;
  varanda: boolean;
  quintal: boolean;
  elevador: boolean;
  acessibilidade: boolean;
  mobiliado: boolean;
}

/** Preferências desejáveis — não excluem o imóvel, só compõem um % de compatibilidade usado
 * para destacar e priorizar os alertas do Modo Passeio. */
export interface PerfilDesejaveis {
  apenasOportunidades: boolean;
  aceitaAnimais: boolean;
  condominioFechado: boolean;
  piscina: boolean;
  varanda: boolean;
  quintal: boolean;
  elevador: boolean;
  acessibilidade: boolean;
  mobiliado: boolean;
}

/** Um perfil de busca salvo do Modo Passeio Inteligente — nomeado, pausável e substituível por
 * outro perfil sem perder a configuração (pedido explícito: "perfis de busca salvos"). */
export interface PerfilBusca {
  id: string;
  nome: string;
  criadoEm: string;
  pausado: boolean;
  raioMetros: RaioPasseio;
  modo: ModoDeslocamento;
  somAtivo: boolean;
  obrigatorios: PerfilObrigatorios;
  desejaveis: PerfilDesejaveis;
}
