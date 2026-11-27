"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ListingPurpose, PerfilBusca, PropertyType } from "@/lib/types";
import { DEFAULT_DESEJAVEIS } from "@/lib/perfil";

export interface Filters {
  finalidade: ListingPurpose;
  tipos: PropertyType[];
  precoMin: number | null;
  precoMax: number | null;
  areaMin: number | null;
  quartosMin: number | null;
  suitesMin: number | null;
  banheirosMin: number | null;
  vagasMin: number | null;
  aceitaAnimais: boolean;
  condominioFechado: boolean;
  piscina: boolean;
  varanda: boolean;
  quintal: boolean;
  elevador: boolean;
  acessibilidade: boolean;
  mobiliado: boolean;
  apenasOportunidades: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  finalidade: "venda",
  tipos: [],
  precoMin: null,
  precoMax: null,
  areaMin: null,
  quartosMin: null,
  suitesMin: null,
  banheirosMin: null,
  vagasMin: null,
  aceitaAnimais: false,
  condominioFechado: false,
  piscina: false,
  varanda: false,
  quintal: false,
  elevador: false,
  acessibilidade: false,
  mobiliado: false,
  apenasOportunidades: false,
};

export type ThemePreference = "light" | "dark" | "system";

interface AppState {
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;

  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  compareList: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;

  poiLayersAtivas: string[];
  togglePoiLayer: (categoria: string) => void;

  // Modo Passeio Inteligente — perfis de busca salvos (filtros obrigatórios + preferências
  // desejáveis), com no máximo um ativo por vez. `perfilAtivoId: null` mantém o comportamento
  // antigo (só raio, sem obrigatório/desejável).
  perfis: PerfilBusca[];
  perfilAtivoId: string | null;
  criarPerfil: (nome: string) => string;
  atualizarPerfil: (id: string, patch: Partial<Omit<PerfilBusca, "id">>) => void;
  duplicarPerfil: (id: string) => string | null;
  removerPerfil: (id: string) => void;
  pausarPerfil: (id: string, pausado: boolean) => void;
  definirPerfilAtivo: (id: string | null) => void;
}

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `perfil_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),

      theme: "system",
      setTheme: (t) => set({ theme: t }),

      favorites: [],
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      compareList: [],
      toggleCompare: (id) =>
        set((state) => {
          if (state.compareList.includes(id)) {
            return { compareList: state.compareList.filter((c) => c !== id) };
          }
          if (state.compareList.length >= 4) return state;
          return { compareList: [...state.compareList, id] };
        }),
      clearCompare: () => set({ compareList: [] }),

      filters: DEFAULT_FILTERS,
      setFilters: (f) => set((state) => ({ filters: { ...state.filters, ...f } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      poiLayersAtivas: [],
      togglePoiLayer: (categoria) =>
        set((state) => ({
          poiLayersAtivas: state.poiLayersAtivas.includes(categoria)
            ? state.poiLayersAtivas.filter((c) => c !== categoria)
            : [...state.poiLayersAtivas, categoria],
        })),

      perfis: [],
      perfilAtivoId: null,
      criarPerfil: (nome) => {
        const id = novoId();
        const f = get().filters;
        const perfil: PerfilBusca = {
          id,
          nome,
          criadoEm: new Date().toISOString(),
          pausado: false,
          raioMetros: 250,
          modo: "pe",
          somAtivo: true,
          // Parte dos filtros obrigatórios já vem do que o usuário filtrou no mapa — evita
          // recomeçar do zero ao criar o perfil.
          obrigatorios: {
            finalidade: f.finalidade,
            tipos: f.tipos,
            precoMax: f.precoMax,
            areaMin: f.areaMin,
            quartosMin: f.quartosMin,
            vagasMin: f.vagasMin,
            aceitaAnimais: f.aceitaAnimais,
            condominioFechado: f.condominioFechado,
            piscina: f.piscina,
            varanda: f.varanda,
            quintal: f.quintal,
            elevador: f.elevador,
            acessibilidade: f.acessibilidade,
            mobiliado: f.mobiliado,
          },
          desejaveis: { ...DEFAULT_DESEJAVEIS },
        };
        set((state) => ({ perfis: [...state.perfis, perfil], perfilAtivoId: id }));
        return id;
      },
      atualizarPerfil: (id, patch) =>
        set((state) => ({
          perfis: state.perfis.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      duplicarPerfil: (id) => {
        const original = get().perfis.find((p) => p.id === id);
        if (!original) return null;
        const novo: PerfilBusca = {
          ...original,
          id: novoId(),
          nome: `${original.nome} (cópia)`,
          criadoEm: new Date().toISOString(),
          pausado: false,
        };
        set((state) => ({ perfis: [...state.perfis, novo] }));
        return novo.id;
      },
      removerPerfil: (id) =>
        set((state) => ({
          perfis: state.perfis.filter((p) => p.id !== id),
          perfilAtivoId: state.perfilAtivoId === id ? null : state.perfilAtivoId,
        })),
      pausarPerfil: (id, pausado) =>
        set((state) => ({
          perfis: state.perfis.map((p) => (p.id === id ? { ...p, pausado } : p)),
        })),
      definirPerfilAtivo: (id) =>
        set((state) => ({
          perfilAtivoId: id,
          // Escolher um perfil pra usar o reativa, mesmo que estivesse pausado.
          perfis: id ? state.perfis.map((p) => (p.id === id ? { ...p, pausado: false } : p)) : state.perfis,
        })),
    }),
    {
      name: "morai:app-state:v1",
    },
  ),
);
