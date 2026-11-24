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
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100",
          {
            "bg-emerald text-dark-green shadow-sm hover:brightness-105": variant === "primary",
            "bg-surface-muted text-foreground": variant === "secondary",
            "bg-transparent text-foreground": variant === "ghost",
            "border border-border-subtle bg-transparent text-foreground": variant === "outline",
            "bg-danger text-white": variant === "danger",
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
