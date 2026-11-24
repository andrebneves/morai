"use client";

import { useMemo, useState } from "react";
import type { Property } from "@/lib/types";
import { formatBRL } from "@/lib/format";
import { totalCustoMensal, simularFinanciamento, type SistemaAmortizacao } from "@/lib/financing";
import { Chip } from "@/components/ui/Chip";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

function FieldMoney({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-28 rounded-lg border border-border-subtle bg-transparent px-2 py-1.5 text-right outline-none"
      />
    </label>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="rounded-2xl border border-border-subtle">
      <button
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-bold">{title}</span>
        <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-1 px-4 pb-4">{children}</div>}
    </div>
  );
}

export function CalculatorsSection({ property }: { property: Property }) {
  const isAluguel = property.finalidade === "aluguel";

  const [entrada, setEntrada] = useState(Math.round(property.preco * 0.2));
  const [prazoAnos, setPrazoAnos] = useState(30);
  const [taxaJuros, setTaxaJuros] = useState(10.5);
  const [sistema, setSistema] = useState<SistemaAmortizacao>("SAC");

  const simulacao = useMemo(
    () =>
      simularFinanciamento({
        valorImovel: property.preco,
        entrada,
        prazoMeses: prazoAnos * 12,
        taxaJurosAnual: taxaJuros,
        sistema,
      }),
    [property.preco, entrada, prazoAnos, taxaJuros, sistema],
  );

  const [base, setBase] = useState(isAluguel ? property.preco : Math.round(simulacao.parcelaPrimeira));
  const [agua, setAgua] = useState(80);
  const [energia, setEnergia] = useState(150);
  const [internet, setInternet] = useState(100);
  const [seguro, setSeguro] = useState(isAluguel ? 25 : 60);
  const [transporte, setTransporte] = useState(200);
  const [outras, setOutras] = useState(0);

  const custoMensal = totalCustoMensal({
    base,
    condominio: property.condominio,
    iptuMensal: property.iptuMensal,
    agua,
    energia,
    internet,
    seguro,
    transporte,
    outras,
  });

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">Calculadoras</h2>

      <Accordion title="Custo real de morar" defaultOpen>
        <FieldMoney label={isAluguel ? "Aluguel mensal" : "Prestação estimada"} value={base} onChange={setBase} />
        <FieldMoney label="Condomínio" value={property.condominio} onChange={() => {}} />
        <FieldMoney label="IPTU mensal" value={property.iptuMensal} onChange={() => {}} />
        <FieldMoney label="Água" value={agua} onChange={setAgua} />
        <FieldMoney label="Energia" value={energia} onChange={setEnergia} />
        <FieldMoney label="Internet" value={internet} onChange={setInternet} />
        <FieldMoney label="Seguro" value={seguro} onChange={setSeguro} />
        <FieldMoney label="Transporte" value={transporte} onChange={setTransporte} />
        <FieldMoney label="Outras despesas" value={outras} onChange={setOutras} />
        <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-muted px-3 py-3">
          <span className="text-sm font-semibold">Total mensal estimado</span>
          <div className="text-right">
            <p className="font-extrabold">{formatBRL(custoMensal)}</p>
            <p className="text-xs text-text-muted">{formatBRL(custoMensal * 12)} /ano</p>
          </div>
        </div>
      </Accordion>

      {!isAluguel && (
        <Accordion title="Simulador de financiamento">
          <FieldMoney label="Valor do imóvel" value={property.preco} onChange={() => {}} />
          <FieldMoney label="Entrada" value={entrada} onChange={setEntrada} />
          <label className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-text-muted">Prazo (anos)</span>
            <input
              type="number"
              value={prazoAnos}
              onChange={(e) => setPrazoAnos(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-border-subtle bg-transparent px-2 py-1.5 text-right outline-none"
            />
          </label>
          <label className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-text-muted">Taxa de juros (% a.a.)</span>
            <input
              type="number"
              step="0.1"
              value={taxaJuros}
              onChange={(e) => setTaxaJuros(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-border-subtle bg-transparent px-2 py-1.5 text-right outline-none"
            />
          </label>
          <div className="flex gap-2 py-2">
            <Chip active={sistema === "SAC"} onClick={() => setSistema("SAC")}>SAC</Chip>
            <Chip active={sistema === "PRICE"} onClick={() => setSistema("PRICE")}>Price</Chip>
          </div>

          <div className="mt-1 space-y-1.5 rounded-xl bg-surface-muted px-3 py-3 text-sm">
            <Row label="Valor financiado" value={formatBRL(simulacao.valorFinanciado)} />
            <Row label="Primeira parcela" value={formatBRL(simulacao.parcelaPrimeira)} />
            <Row label="Última parcela" value={formatBRL(simulacao.parcelaUltima)} />
            <Row label="Total estimado" value={formatBRL(simulacao.totalEstimado)} />
          </div>
          <p className="pt-2 text-[11px] text-text-muted">
            Simulação simplificada e demonstrativa — não constitui proposta bancária nem aprovação de crédito.
          </p>
        </Accordion>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
