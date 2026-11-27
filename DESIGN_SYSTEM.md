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

- Fonte: **Plus Jakarta Sans** (Google Fonts, via `next/font`), pesos 400–800. Trocada a partir de
  Manrope por pedido explícito do briefing de direção de arte — avaliada sem perda de legibilidade,
  por isso a troca foi aplicada globalmente (`src/app/layout.tsx`, token `--font-jakarta`).
- Hierarquia: títulos em `font-extrabold`/`font-bold`, corpo em `font-medium`/`font-normal`, textos
  auxiliares (`text-text-muted`) em tamanhos menores (`text-xs`/`text-[11px]`).

## Componentes base (`src/components/ui`, `src/components/layout`)

- **Button** — variantes de tamanho (`sm`/`md`/`lg`), `fullWidth`, estados de loading/disabled.
  Variante `primary`: verde-escuro sólido (`bg-dark-green`) com texto `off-white` e uma borda
  esmeralda sutil (`border-emerald/35`) — a borda é essencial no tema escuro, onde `--surface` já é
  um verde próximo do `dark-green` e o botão ficaria quase invisível sem ela.
- **Chip** — pílula selecionável usada em filtros, prioridades do Bairro Ideal, tipo de toggle.
- **BottomSheet** — folha inferior com arraste para fechar (Framer Motion `drag`), respeita
  `safe-area-inset-bottom`, usada para preview de imóvel, filtros, Modo Passeio, feedback, instalação.
- **MoraiHeader** (`src/components/layout/MoraiHeader.tsx`) — painel verde-escuro sólido com uma
  curva orgânica decorativa (dois gradientes radiais em esmeralda, cortados pelo `overflow-hidden`
  do painel) atrás da logo; usado no topo do mapa. Recebe conteúdo da tela (busca, chips) como
  `children`, renderizado dentro do painel.

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
  pelo Moraí Radar, e um iconezinho de casa à esquerda num badge lima (visual "sticker"). Clusters são
  círculos com contagem, tamanho proporcional à quantidade de imóveis.
- **Todo imóvel demonstrativo é claramente rotulado** — badge "Demonstrativo" nos cards e no detalhe;
  imóveis cadastrados por usuários reais (quando Supabase está configurado) **não** recebem esse rótulo.

## Estilo visual do mapa — "Moraí Toy"

O app funciona como um GPS de navegação (tipo Waze), mas a aparência do mapa é propositalmente
estilizada, com cara de jogo de simulação (SimCity/The Sims), em vez do visual fotorrealista padrão
de mapas como Google Maps.

- Base: tiles vetoriais gratuitos da OpenFreeMap (esquema OpenMapTiles, estilo "liberty"), sem API key.
- `src/components/map/libertyBase.json` é um snapshot desse estilo base; `src/components/map/mapStyles.ts`
  aplica um patch de cores (`TOY_PAINT_OVERRIDES`) por cima dele — só sobrescreve propriedades de cor
  (`fill-color`, `line-color`, `text-color` etc.), mantendo geometria/zoom/espessuras originais.
- Paleta: chão verde-claro tipo gramado (`#DCEFC9`), água azul-turquesa vivo (`#6FC7E8`), prédios em tom
  pêssego/terracota (`#F3B88A`), vias em tons quentes (creme/laranja) em vez do cinza realista, parques e
  áreas verdes em tons de verde mais saturados. Hillshade fotográfico (`natural_earth`) desligado para
  manter o visual "chapado" de jogo.
- Para atualizar a base (ex.: nova versão do estilo "liberty" da OpenFreeMap), rebaixar
  `https://tiles.openfreemap.org/styles/liberty` sobre `libertyBase.json` e conferir se os ids de layer
  usados em `TOY_PAINT_OVERRIDES` ainda existem.
- O estilo satélite (`SATELLITE_STYLE`, imagens Esri) não foi alterado — é uma camada alternativa, não o
  modo padrão.

## Animações

- `sheet-up` — entrada do bottom sheet.
- `fade-in` — transições suaves de conteúdo.
- `pulse-ring` — anel pulsante no marcador de localização do usuário no mapa.
- `morai-pin-pop` — efeito de "pop" elástico quando um marcador de imóvel aparece no mapa.
- Transições de hover/active em botões via Tailwind (`transition-transform`, `active:scale-90`).
- Botão `danger` mantém a sombra sólida inferior ("borda 3D") que desaparece e o botão desce 1px ao
  ser pressionado (`active:translate-y-1 active:shadow-none`) — efeito "botão de jogo". O botão
  `primary` trocou esse efeito por uma sombra flutuante mais discreta (`shadow-[var(--shadow-float)]`
  + `active:scale-[0.97]`), seguindo a nova direção de arte.

## Direção de arte — redesign "app de navegação imobiliário" (briefing 2026-11-27)

O usuário trouxe um briefing extenso de direção de arte com 7 imagens de referência e pediu
explicitamente: **"Não quero que o Moraí pareça um aplicativo imobiliário que possui um mapa. Quero
que pareça um aplicativo de navegação inteligente especializado no mercado imobiliário."** Essa
distinção orienta todo o redesign a partir de agora. A paleta de cores do briefing já era idêntica
aos tokens acima (nenhuma mudança de cor precisou ser feita); o que mudou foi tipografia, o
componente de botão primário e a introdução de um cabeçalho sólido com identidade própria.

O próprio briefing definiu 5 níveis de prioridade pro redesign, pra não tentar tudo de uma vez:

1. **Design system, identidade visual, tipografia, botões, cabeçalho, navegação inferior** — feito
   nesta rodada: tipografia (Plus Jakarta Sans), botão primário (verde-escuro + borda esmeralda) e
   `MoraiHeader` (painel sólido com curva orgânica) no mapa. Navegação inferior já batia com a
   referência (selo lima na aba ativa) e não precisou de mudança.
2. Estilo cartográfico "Moraí Claro", marcadores de preço, localização do usuário, botões
   flutuantes, **filtros rápidos** (chips de filtro ativo acima do mapa, visto nas referências — hoje
   só existe o contador no botão de filtros) e cartão inferior do imóvel — **ainda não feito**.
3. Configuração do Modo Passeio, alertas de proximidade, filtros avançados — **ainda não feito**.
4. Detalhes dos imóveis, favoritos, comparação, custo real de morar — **ainda não feito**.
5. POIs ilustrados, mapa 3D, tema noturno, microinterações avançadas — **ainda não feito**.

Itens 2–5 ficam registrados como próxima fase no [ROADMAP.md](ROADMAP.md), um de cada vez, em vez de
uma reforma visual completa de uma vez só (risco de regressão alto sem revisar tela por tela).

## Acessibilidade e contraste

- Textos sobre fundo escuro usam `--color-off-white`; textos sobre lima/esmeralda usam
  `--color-dark-green` para manter contraste adequado (nunca texto escuro sobre fundo escuro ou
  vice-versa).
- Toda ação destrutiva ou importante (remover favorito, apagar dados locais) usa confirmação ou cor de
  alerta (`--color-danger`/`--color-warning`).
