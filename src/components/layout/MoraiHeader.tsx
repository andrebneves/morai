import type { ReactNode } from "react";
import { Logo } from "@/components/icons/Logo";

interface MoraiHeaderProps {
  /** Conteúdo abaixo da logo (busca, chips de filtro rápido, badges) — cada tela compõe o que
   * precisa, o cabeçalho só dá a moldura visual (painel verde-escuro + curva orgânica). */
  children?: ReactNode;
  loading?: boolean;
  /** Selo ao lado da logo (ex. "Rota ativa" quando o GPS do Moraí está guiando até um imóvel) —
   * pedido explícito do briefing visual, reforça a leitura de app de navegação. */
  badge?: ReactNode;
}

/** Painel de cabeçalho verde-escuro sólido com uma curva orgânica decorativa, usado nas telas
 * principais (mapa, explorar) — identidade visual pedida no briefing de direção de arte: o
 * Moraí deve parecer um app de navegação dedicado ao mercado imobiliário, não um app
 * imobiliário comum que por acaso tem um mapa. Antes a logo flutuava solta sobre o mapa sem
 * nenhum painel sólido por trás. */
export function MoraiHeader({ children, loading, badge }: MoraiHeaderProps) {
  return (
    <div className="pointer-events-auto relative z-20 overflow-hidden rounded-b-[28px] bg-dark-green pt-safe shadow-[var(--shadow-float)]">
      {/* Curva orgânica decorativa — dois círculos com gradiente radial, parcialmente fora da
          área visível, cortados pelo overflow-hidden do painel. Puramente decorativo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle at 60% 40%, var(--color-emerald), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-6 h-40 w-40 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle at 50% 50%, var(--color-emerald), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-3 px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Logo size={26} variant="light" wordmarkClassName="text-lg text-off-white drop-shadow-sm" />
            {badge}
          </div>
          {loading && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" aria-label="Carregando" />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
