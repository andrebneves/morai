"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { buildQuickFilterChips } from "@/lib/quickFilterChips";
import type { Filters } from "@/lib/store/useAppStore";

interface QuickFilterChipsProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

/** Fileira de cápsulas com os filtros ativos, logo abaixo da busca — pedido explícito do
 * briefing ("os filtros precisam ser funcionais [...], não devem ser apenas elementos
 * decorativos"): cada cápsula remove só o próprio critério e atualiza o mapa na hora. Some
 * sozinha quando não há nenhum filtro ativo (não ocupa espaço à toa). */
export function QuickFilterChips({ filters, onChange }: QuickFilterChipsProps) {
  const chips = buildQuickFilterChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.button
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange(chip.remove)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-lime py-1.5 pl-3 pr-2 text-xs font-bold text-dark-green shadow-[var(--shadow-float)]"
          >
            <chip.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{chip.label}</span>
            <X className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
