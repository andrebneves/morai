"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { ListingPurpose } from "@/lib/types";

interface PurposeToggleProps {
  value: ListingPurpose;
  onChange: (v: ListingPurpose) => void;
}

export function PurposeToggle({ value, onChange }: PurposeToggleProps) {
  const router = useRouter();

  const items: { key: ListingPurpose | "anunciar"; label: string }[] = [
    { key: "venda", label: "Comprar" },
    { key: "aluguel", label: "Alugar" },
    { key: "anunciar", label: "Anunciar" },
  ];

  return (
    <div className="flex items-center gap-2 rounded-full bg-surface p-1 shadow-[var(--shadow-float)]">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === "anunciar") router.push("/anunciar");
              else onChange(item.key);
            }}
            className={clsx(
              "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              active ? "bg-lime text-dark-green" : "text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
