import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Os 3 níveis do briefing de direção de arte: "primary" = botão principal (lima/verde-escuro,
  // ex. "Aplicar filtros", "Publicar imóvel"); "dark" = botão secundário (verde-escuro/texto
  // claro, ex. "Ir até lá", "Ver detalhes"); "outline" = botão terciário (contorno, ex. "Salvar").
  variant?: "primary" | "dark" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-40 disabled:active:translate-y-0 disabled:active:scale-100",
          {
            // Botão principal (briefing de direção de arte): fundo verde-lima, texto verde
            // profundo — usado nas CTAs centrais de cada tela ("Aplicar filtros", "Publicar
            // imóvel", "Calcular compatibilidade" etc.).
            "bg-lime text-dark-green shadow-[var(--shadow-float)] hover:brightness-105 active:scale-[0.97]":
              variant === "primary",
            // Botão secundário (briefing): fundo verde-escuro sólido, texto claro — usado em
            // ações contextuais de navegação ("Ir até lá", "Ver detalhes", "Comparar imóveis").
            // A borda esmeralda sutil é essencial no tema escuro: sem ela o botão quase
            // desaparece contra o `--surface` escuro (ambos são verdes próximos) — no tema claro
            // ela é discreta.
            "border border-emerald/35 bg-dark-green text-off-white shadow-[var(--shadow-float)] hover:brightness-110 active:scale-[0.97]":
              variant === "dark",
            "bg-surface-muted text-foreground active:scale-[0.97]": variant === "secondary",
            "bg-transparent text-foreground active:scale-[0.97]": variant === "ghost",
            // Botão terciário (briefing): fundo off-white/branco, contorno e texto verde
            // profundo — usado em ações de apoio ("Salvar", "Compartilhar", "Cancelar").
            "border border-dark-green/25 bg-surface text-foreground active:scale-[0.97]":
              variant === "outline",
            "bg-danger text-white shadow-[0_4px_0_0_#a01818] active:translate-y-1 active:shadow-none":
              variant === "danger",
          },
          {
            "h-9 px-4 text-sm": size === "sm",
            "h-12 px-5 text-sm": size === "md",
            "h-14 px-6 text-base": size === "lg",
          },
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
