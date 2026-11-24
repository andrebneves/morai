"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Plus } from "lucide-react";
import type { ListingPurpose } from "@/lib/types";

interface PurposeToggleProps {
  value: ListingPurpose;
  onChange: (v: ListingPurpose) => void;
}

/** Comprar = esmeralda, Alugar = lima — as duas cores de destaque da marca, pra dar pra
 * diferenciar o modo num relance (pedido do usuário). "Anunciar" não é um estado do toggle
 * (sempre leva pra outra tela), por isso tem um visual mais discreto, com ícone de "+". */
export function PurposeToggle({ value, onChange }: PurposeToggleProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-dark-green p-1.5 shadow-[var(--shadow-float)]">
      <button
        onClick={() => onChange("venda")}
        className={clsx(
          "rounded-full px-4 py-2 text-sm font-extrabold tracking-tight whitespace-nowrap transition-all active:scale-95",
          value === "venda"
            ? "bg-emerald text-dark-green shadow-[0_3px_0_rgba(0,61,50,0.35)]"
            : "text-off-white/55",
        )}
      >
        Comprar
      </button>
      <button
        onClick={() => onChange("aluguel")}
        className={clsx(
          "rounded-full px-4 py-2 text-sm font-extrabold tracking-tight whitespace-nowrap transition-all active:scale-95",
          value === "aluguel"
            ? "bg-lime text-dark-green shadow-[0_3px_0_rgba(0,61,50,0.35)]"
            : "text-off-white/55",
        )}
      >
        Alugar
      </button>
      <button
        onClick={() => router.push("/anunciar")}
        className="flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-bold text-off-white/55 whitespace-nowrap active:scale-95 transition-transform"
      >
        <Plus className="h-3.5 w-3.5" />
        Anunciar
      </button>
    </div>
  );
}
