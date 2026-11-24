"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ListingPurpose, PropertyType } from "@/lib/types";

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
    }),
    {
      name: "morai:app-state:v1",
    },
  ),
);
