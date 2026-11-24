import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

export function Chip({ active, icon, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors active:scale-95",
        active
          ? "border-emerald bg-emerald text-dark-green"
          : "border-border-subtle bg-surface text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
