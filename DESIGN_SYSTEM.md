# Design System — Moraí

## Identidade

- Wordmark: **moraí.** — sempre minúsculo, com o ponto final na cor lima (`--color-lime`).
- Símbolo: pin de localização combinado com um ícone de casa (`src/components/icons/LogoMark.tsx`),
  gradiente verde-esmeralda → verde-escuro, com um ponto de destaque lima.
- Slogan: "Sua próxima casa pode estar na próxima esquina."
- Tom: premium, direto, sem jargão imobiliário tradicional. Sem emojis na interface.

## Paleta de cores

Definida como CSS custom properties em `src/app/globals.css`, mapeadas para tokens Tailwind v4 via
`@theme inline`.

| Token | Hex | Uso |
|---|---|---|
| `--color-deep-green` | `#003D32` | Verde principal, fundo de elementos escuros, marcadores |
| `--color-dark-green` | `#062A24` | Fundo em tema escuro, texto sobre lima/esmeralda |
| `--color-emerald` | `#00E58A` | Cor de destaque/ação primária, estados ativos |
| `--color-lime` | `#C5FF35` | Acento de alto contraste (ponto do logo, badges de oportunidade) |
| `--color-off-white` | `#F5F7F2` | Fundo em tema claro, texto sobre fundos escuros |
| `--color-graphite` | `#172522` | Texto principal em tema claro |

O tema (claro/escuro) é resolvido via `:root[data-theme="dark"|"light"]` e
`@media (prefers-color-scheme: dark)` quando o usuário escolhe "Sistema". Preferência salva em
`useAppStore` (`theme: "light" | "dark" | "system"`).

## Tipografia

- Fonte: **Manrope** (Google Fonts, via `next/font`), peso variável.
- Hierarquia: títulos em `font-extrabold`/`font-bold`, corpo em `font-medium`/`font-normal`, textos
  auxiliares (`text-text-muted`) em tamanhos menores (`text-xs`/`text-[11px]`).

## Componentes base (`src/components/ui`)

- **Button** — variantes de tamanho (`sm`/`md`/`lg`), `fullWidth`, estados de loading/disabled.
- **Chip** — pílula selecionável usada em filtros, prioridades do Bairro Ideal, tipo de toggle.
- **BottomSheet** — folha inferior com arraste para fechar (Framer Motion `drag`), respeita
  `safe-area-inset-bottom`, usada para preview de imóvel, filtros, Modo Passeio, feedback, instalação.

## Princípios de layout

- **Mapa-cêntrico**: o mapa ocupa a tela inteira; controles (busca, filtros, toggle comprar/alugar,
  camadas, locate-me) flutuam por cima em cards com `shadow-[var(--shadow-float)]`.
- **Navegação de uma mão**: ações principais e a barra inferior (`BottomNav`, 5 abas) ficam na metade
  inferior da tela; o Modo Passeio tem um botão de acesso direto flutuante no mapa.
- **Toque confortável**: alvos de toque mínimos de 32–44px (botões circulares de ação, itens de lista).
- **Safe area do iPhone**: classes utilitárias `pt-safe`/`pb-safe` (usando `env(safe-area-inset-*)`)
  aplicadas em todas as telas com conteúdo fixo no topo/rodapé, para respeitar o notch/Dynamic Island e
  a barra de gestos.
- **Sem emojis na UI** — ícones vêm exclusivamente da biblioteca `lucide-react`.
- **Marcadores de preço no mapa**: pílula com preço compacto (ex. "R$ 1,7 mi", "/mês" para aluguel),
  cor verde-escuro (venda) com destaque lima + ponto quando o imóvel é classificado como oportunidade
  pelo Moraí Radar. Clusters são círculos com contagem, tamanho proporcional à quantidade de imóveis.
- **Todo imóvel demonstrativo é claramente rotulado** — badge "Demonstrativo" nos cards e no detalhe;
  imóveis cadastrados por usuários reais (quando Supabase está configurado) **não** recebem esse rótulo.

## Animações

- `sheet-up` — entrada do bottom sheet.
- `fade-in` — transições suaves de conteúdo.
- `pulse-ring` — anel pulsante no marcador de localização do usuário no mapa.
- Transições de hover/active em botões via Tailwind (`transition-transform`, `active:scale-90`).

## Acessibilidade e contraste

- Textos sobre fundo escuro usam `--color-off-white`; textos sobre lima/esmeralda usam
  `--color-dark-green` para manter contraste adequado (nunca texto escuro sobre fundo escuro ou
  vice-versa).
- Toda ação destrutiva ou importante (remover favorito, apagar dados locais) usa confirmação ou cor de
  alerta (`--color-danger`/`--color-warning`).
