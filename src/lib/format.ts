export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatBRLPrecise(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

export function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  if (value >= 1000) {
    return `R$ ${Math.round(value / 1000)} mil`;
  }
  return formatBRL(value);
}

export function formatArea(m2: number): string {
  return `${m2.toLocaleString("pt-BR")} m²`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TIPO_LABELS: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  casa_condominio: "Casa em condomínio",
  cobertura: "Cobertura",
  kitnet: "Kitnet",
  terreno: "Terreno",
  comercial: "Comercial",
};

export function labelTipo(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo;
}
