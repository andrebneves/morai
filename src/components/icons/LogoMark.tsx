interface LogoMarkProps {
  size?: number;
  className?: string;
  /** "gradient" para uso normal, "flat" para contextos monocromáticos (favicon mono, impressão) */
  variant?: "gradient" | "flat" | "light";
}

/**
 * Símbolo do Moraí: um marcador de localização (pin) com uma casa estilizada
 * no interior. Usado como ícone do app, favicon e selo de marca.
 */
export function LogoMark({ size = 40, className, variant = "gradient" }: LogoMarkProps) {
  const gradientId = "morai-pin-gradient";

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Moraí"
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="6" x2="88" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00E58A" />
          <stop offset="1" stopColor="#003D32" />
        </linearGradient>
      </defs>
      <path
        d="M50 4C71.98 4 89.5 21.6 89.5 43.4C89.5 57.3 80.4 69 69.7 80.4C62.9 87.7 56.3 93.9 52.1 106.6C51.4 108.9 48.6 108.9 47.9 106.6C43.7 93.9 37.1 87.7 30.3 80.4C19.6 69 10.5 57.3 10.5 43.4C10.5 21.6 28.02 4 50 4Z"
        fill={
          variant === "gradient"
            ? `url(#${gradientId})`
            : variant === "light"
              ? "#F5F7F2"
              : "#003D32"
        }
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 24L74 45V68C74 70.76 71.76 73 69 73H31C28.24 73 26 70.76 26 68V45L50 24ZM46.5 73V56.5H53.5V73H46.5Z"
        fill={variant === "light" ? "#003D32" : "#F5F7F2"}
      />
      <circle cx="78" cy="30" r="7" fill="#C5FF35" />
    </svg>
  );
}
