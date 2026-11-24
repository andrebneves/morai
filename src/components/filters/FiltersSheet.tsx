"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DEFAULT_FILTERS, useAppStore } from "@/lib/store/useAppStore";
import type { PropertyType } from "@/lib/types";
import { labelTipo } from "@/lib/format";

interface FiltersSheetProps {
  open: boolean;
  onClose: () => void;
  resultCount: number;
}

const TIPOS: PropertyType[] = [
  "casa",
  "apartamento",
  "casa_condominio",
  "cobertura",
  "kitnet",
  "terreno",
  "comercial",
];

const BOOLEAN_FEATURES: { key: keyof typeof DEFAULT_FILTERS; label: string }[] = [
  { key: "aceitaAnimais", label: "Aceita animais" },
  { key: "condominioFechado", label: "Condomínio fechado" },
  { key: "piscina", label: "Piscina" },
  { key: "varanda", label: "Varanda" },
  { key: "quintal", label: "Quintal" },
  { key: "elevador", label: "Elevador" },
  { key: "acessibilidade", label: "Acessibilidade" },
  { key: "mobiliado", label: "Mobiliado" },
];

export function FiltersSheet({ open, onClose, resultCount }: FiltersSheetProps) {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  return (
    <BottomSheet open={open} onClose={onClose} maxHeightVh={90}>
      <div className="space-y-6 px-5 pb-6 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Filtros</h2>
          <button onClick={resetFilters} className="text-sm font-semibold text-emerald">
            Limpar tudo
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Tipo de imóvel</h3>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((tipo) => (
              <Chip
                key={tipo}
                active={filters.tipos.includes(tipo)}
                onClick={() =>
                  setFilters({
                    tipos: filters.tipos.includes(tipo)
                      ? filters.tipos.filter((t) => t !== tipo)
                      : [...filters.tipos, tipo],
                  })
                }
              >
                {labelTipo(tipo)}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">
            {filters.finalidade === "venda" ? "Preço (venda)" : "Preço (aluguel mensal)"}
          </h3>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Mínimo"
              value={filters.precoMin ?? ""}
              onChange={(e) => setFilters({ precoMin: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2.5 text-sm outline-none"
            />
            <input
              type="number"
              placeholder="Máximo"
              value={filters.precoMax ?? ""}
              onChange={(e) => setFilters({ precoMax: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Área mínima (m²)</h3>
          <input
            type="number"
            placeholder="Ex: 60"
            value={filters.areaMin ?? ""}
            onChange={(e) => setFilters({ areaMin: e.target.value ? Number(e.target.value) : null })}
            className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2.5 text-sm outline-none"
          />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <NumberStepper
            label="Quartos"
            value={filters.quartosMin}
            onChange={(v) => setFilters({ quartosMin: v })}
          />
          <NumberStepper
            label="Suítes"
            value={filters.suitesMin}
            onChange={(v) => setFilters({ suitesMin: v })}
          />
          <NumberStepper
            label="Banheiros"
            value={filters.banheirosMin}
            onChange={(v) => setFilters({ banheirosMin: v })}
          />
          <NumberStepper
            label="Vagas"
            value={filters.vagasMin}
            onChange={(v) => setFilters({ vagasMin: v })}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Características</h3>
          <div className="flex flex-wrap gap-2">
            {BOOLEAN_FEATURES.map((f) => (
              <Chip
                key={f.key}
                active={Boolean(filters[f.key])}
                onClick={() => setFilters({ [f.key]: !filters[f.key] } as never)}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Moraí Radar</h3>
          <Chip
            active={filters.apenasOportunidades}
            onClick={() => setFilters({ apenasOportunidades: !filters.apenasOportunidades })}
          >
            Apenas oportunidades (abaixo da referência)
          </Chip>
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-surface p-4 pb-safe">
        <Button fullWidth size="lg" onClick={onClose}>
          Ver resultados ({resultCount})
        </Button>
      </div>
    </BottomSheet>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value && value > 0 ? value - 1 : null)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-sm"
        >
          −
        </button>
        <span className="w-4 text-center text-sm font-semibold">{value ?? "—"}</span>
        <button
          onClick={() => onChange((value ?? 0) + 1)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
