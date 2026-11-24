import { LogoMark } from "@/components/icons/LogoMark";

interface LogoProps {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  variant?: "gradient" | "flat" | "light";
  showWordmark?: boolean;
}

export function Logo({
  size = 28,
  className,
  wordmarkClassName,
  variant = "gradient",
  showWordmark = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight lowercase ${wordmarkClassName ?? "text-xl"}`}
        >
          moraí<span className="text-lime">.</span>
        </span>
      )}
    </div>
  );
}
