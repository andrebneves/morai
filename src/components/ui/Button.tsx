import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
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
            // Verde-escuro sólido com texto claro — convenção de botão primário da nova
            // direção de arte (Moraí como plataforma de navegação, não "imobiliário com mapa"),
            // substituindo o antigo verde-claro com efeito 3D de botão de jogo. A borda esmeralda
            // sutil é essencial no tema escuro: sem ela o botão quase desaparece contra o
            // `--surface` escuro (ambos são verdes próximos) — no tema claro ela é discreta.
            "border border-emerald/35 bg-dark-green text-off-white shadow-[var(--shadow-float)] hover:brightness-110 active:scale-[0.97]":
              variant === "primary",
            "bg-surface-muted text-foreground active:scale-[0.97]": variant === "secondary",
            "bg-transparent text-foreground active:scale-[0.97]": variant === "ghost",
            "border border-border-subtle bg-transparent text-foreground active:scale-[0.97]":
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
