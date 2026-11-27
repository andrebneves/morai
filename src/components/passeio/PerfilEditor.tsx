"use client";

import { Chip } from "@/components/ui/Chip";
import { labelTipo } from "@/lib/format";
import type { PerfilBusca, PropertyType } from "@/lib/types";

const TIPOS: PropertyType[] = [
  "casa",
  "apartamento",
  "casa_condominio",
  "cobertura",
  "kitnet",
  "terreno",
  "comercial",
];

type CaracteristicaKey =
  | "aceitaAnimais"
  | "condominioFechado"
  | "piscina"
  | "varanda"
  | "quintal"
  | "elevador"
  | "acessibilidade"
  | "mobiliado";

const CARACTERISTICAS: { key: CaracteristicaKey; label: string }[] = [
  { key: "aceitaAnimais", label: "Aceita animais" },
  { key: "condominioFechado", label: "Condomínio fechado" },
  { key: "piscina", label: "Piscina" },
  { key: "varanda", label: "Varanda" },
  { key: "quintal", label: "Quintal" },
  { key: "elevador", label: "Elevador" },
  { key: "acessibilidade", label: "Acessibilidade" },
  { key: "mobiliado", label: "Mobiliado" },
];

interface PerfilEditorProps {
  perfil: PerfilBusca;
  onChange: (patch: Partial<Pick<PerfilBusca, "obrigatorios" | "desejaveis">>) => void;
}

/** Editor dos dois blocos de um perfil de busca: obrigatório (exclui o imóvel se não bater) e
 * desejável (só soma no % de compatibilidade do alerta) — a distinção pedida explicitamente
 * pro Modo Passeio Inteligente. */
export function PerfilEditor({ perfil, onChange }: PerfilEditorProps) {
  const { obrigatorios: o, desejaveis: d } = perfil;

  return (
    <div className="mt-3 space-y-4 border-t border-border-subtle pt-3">
      <section className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-danger">
          Obrigatório — exclui o imóvel se não bater
        </h4>
        <div className="flex gap-1.5">
          <Chip active={o.finalidade === "venda"} onClick={() => onChange({ obrigatorios: { ...o, finalidade: "venda" } })}>
            Comprar
          </Chip>
          <Chip active={o.finalidade === "aluguel"} onClick={() => onChange({ obrigatorios: { ...o, finalidade: "aluguel" } })}>
            Alugar
          </Chip>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map((tipo) => (
            <Chip
              key={tipo}
              active={o.tipos.includes(tipo)}
              onClick={() =>
                onChange({
                  obrigatorios: {
                    ...o,
                    tipos: o.tipos.includes(tipo) ? o.tipos.filter((t) => t !== tipo) : [...o.tipos, tipo],
                  },
                })
              }
            >
              {labelTipo(tipo)}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Preço máximo"
            value={o.precoMax ?? ""}
            onChange={(e) =>
              onChange({ obrigatorios: { ...o, precoMax: e.target.value ? Number(e.target.value) : null } })
            }
            className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="Área mínima (m²)"
            value={o.areaMin ?? ""}
            onChange={(e) =>
              onChange({ obrigatorios: { ...o, areaMin: e.target.value ? Number(e.target.value) : null } })
            }
            className="w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CARACTERISTICAS.map((f) => (
            <Chip key={f.key} active={o[f.key]} onClick={() => onChange({ obrigatorios: { ...o, [f.key]: !o[f.key] } })}>
              {f.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-emerald">
          Desejável — só pontua, não exclui
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={d.apenasOportunidades}
            onClick={() => onChange({ desejaveis: { ...d, apenasOportunidades: !d.apenasOportunidades } })}
          >
            Oportunidade (Moraí Radar)
          </Chip>
          {CARACTERISTICAS.map((f) => (
            <Chip key={f.key} active={d[f.key]} onClick={() => onChange({ desejaveis: { ...d, [f.key]: !d[f.key] } })}>
              {f.label}
            </Chip>
          ))}
        </div>
      </section>
    </div>
  );
}
