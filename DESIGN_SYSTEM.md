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

- **Button** — variantes de tamanho (`sm`/`md`/`lg`), `fullWidth`, estados de loading/disabled. Os
  3 níveis de botão do briefing de direção de arte:
  - `primary` (**botão principal**): fundo lima, texto verde-escuro — CTA central de cada tela
    ("Aplicar filtros", "Publicar imóvel", "Ver resultados").
  - `dark` (**botão secundário**): verde-escuro sólido com texto claro e borda esmeralda sutil — a
    borda é essencial no tema escuro, onde `--surface` já é um verde próximo do `dark-green` e o
    botão ficaria quase invisível sem ela — ações contextuais de navegação ("Ir até lá", "Ver
    detalhes").
  - `outline` (**botão terciário**): fundo claro, contorno e texto verde-escuro — ações de apoio
    ("Salvar", "Comparar").
- **Chip** — pílula selecionável usada em filtros, prioridades do Bairro Ideal, tipo de toggle.
- **BottomSheet** — folha inferior com arraste para fechar (Framer Motion `drag`), respeita
  `safe-area-inset-bottom`, usada para preview de imóvel, filtros, Modo Passeio, feedback, instalação.
- **MoraiHeader** (`src/components/layout/MoraiHeader.tsx`) — painel verde-escuro sólido com uma
  curva orgânica decorativa (dois gradientes radiais em esmeralda, cortados pelo `overflow-hidden`
  do painel) atrás da logo; usado no topo do mapa. Recebe conteúdo da tela (busca, chips) como
  `children`, renderizado dentro do painel.
- **QuickFilterChips** (`src/components/map/QuickFilterChips.tsx`) — fileira de cápsulas lima com
  os filtros ativos (ícone + texto + X), derivada do estado de filtros por
  `src/lib/quickFilterChips.ts`. Cada cápsula remove só o próprio critério.

## Princípios de layout

- **Mapa-cêntrico**: o mapa ocupa a tela inteira; controles (busca, filtros, toggle comprar/alugar,
  camadas, locate-me) flutuam por cima em cards com `shadow-[var(--shadow-float)]`.
- **Navegação de uma mão**: ações principais e a barra inferior (`BottomNav`, 5 abas) ficam na metade
  inferior da tela; a configuração de Minha Busca (raio, perfis, alertas — chamada de "Modo Passeio"
  só internamente no código) tem um botão de acesso direto flutuante no mapa.
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

## Estilo visual do mapa — "Moraí Classic"

O app funciona como um GPS de navegação (tipo Waze), com uma aparência cartográfica proprietária —
mar turquesa, praia em tom natural de areia, ruas claras e legíveis, construções em bege/pastel com
sombra suave — em vez do visual fotorrealista padrão de mapas como Google Maps. Substituiu a paleta
anterior ("Moraí Toy", mais saturada/estilo jogo de simulação SimCity/The Sims) por pedido explícito
do briefing "Moraí Maps — motor cartográfico com identidade visual própria" (2026-11-27).

- Base: tiles vetoriais gratuitos da OpenFreeMap (esquema OpenMapTiles, estilo "liberty"), sem API key.
- `src/components/map/libertyBase.json` é um snapshot desse estilo base; `src/components/map/mapStyles.ts`
  aplica um patch de cores (`MORAI_CLASSIC_PAINT_OVERRIDES`) por cima dele — só sobrescreve propriedades
  de cor (`fill-color`, `line-color`, `text-color` etc.), mantendo geometria/zoom/espessuras originais.
- Paleta: chão em bege claro (`#F3EDDD`), mar azul-turquesa (`#2CC7D4`–`#5BD1D9` por zoom), praia em
  areia natural (`#F3E1C3`), prédios (2D e 3D via `fill-extrusion`) em bege/pastel (`#E9DEC4`), vias em
  tons claros/creme (`#FBF4E3`/`#FDF8EC`) em vez do laranja saturado anterior, parques/vegetação em
  verde mais suave (menos saturado que a versão "Toy"). Prédios 3D usam `render_height`/
  `render_min_height` reais do OpenMapTiles (nunca alturas inventadas). Hillshade fotográfico
  (`natural_earth`) desligado para manter a leitura "ilustrada", não fotorrealista.
- Para atualizar a base (ex.: nova versão do estilo "liberty" da OpenFreeMap), rebaixar
  `https://tiles.openfreemap.org/styles/liberty` sobre `libertyBase.json` e conferir se os ids de layer
  usados em `MORAI_CLASSIC_PAINT_OVERRIDES` ainda existem.

### Ícones de POI próprios (biblioteca "Moraí Maps", 2026-11-27)

O usuário forneceu uma biblioteca de 231 ilustrações isométricas prontas (PNG, fundo transparente,
recortadas de 3 pranchas originais) — importada para `design/map-assets/` (manifest.json documenta
`id`, dimensões, âncora sugerida e origem de cada arquivo; `LEIA-ME.txt` avisa que a remoção de fundo
é aproximada e pode ter artefatos em alguns itens).

- **Implementado**: 20 classes de POI do OpenMapTiles (farmácia, hospital, posto de saúde, escola,
  universidade, padaria, restaurante, cafeteria, lanchonete, posto de combustível, banco, correios,
  museu, ponto turístico, igreja, parque, mercado/loja, supermercado, delegacia, bombeiros) agora
  renderizam com a ilustração isométrica própria em vez do ícone genérico da OpenFreeMap.
  - `scripts/generate-poi-sprite.mjs` gera `public/map-assets/sprites/morai-poi{.png,.json,@2x.png,@2x.json}`:
    parte da sprite padrão vendorizada (`scripts/vendor/ofm-sprite/`, mantém todo ícone não-customizado
    idêntico) e adiciona, numa faixa extra do atlas, as 20 ilustrações redimensionadas (mantendo
    proporção, sem upscale) para ~34px de altura em 1x. `CLASS_TO_ASSET` no topo do script é o
    mapeamento classe OSM → arquivo; rodar `node scripts/generate-poi-sprite.mjs` depois de qualquer
    mudança nesse mapeamento ou nos PNGs de origem.
  - `mapStyles.ts` aponta `style.sprite` para essa sprite própria (URL absoluta resolvida em runtime
    via `window.location.origin` — MapLibre exige URL absoluta) e adiciona `icon-anchor: "bottom"`
    via expressão `match` nas 3 layers de POI (`poi_r20`/`poi_r7`/`poi_r1`) só para essas 20 classes —
    o resto continua ancorado ao centro, igual ao padrão.
- **Backlog, não implementado** (mesma biblioteca, categorias que não são POIs genéricos do OSM e
  precisam de uma abordagem diferente — ver `design/map-assets/manifest.json` para a lista completa):
  - `18_marcadores/imovel.png` e `18_marcadores/selecionado.png` — **implementado**: o pin simples do
    imóvel (zoom abaixo de `PRICE_LABEL_MIN_ZOOM`, sem etiqueta de preço) usa essas ilustrações em vez
    do ícone SVG de casa desenhado à mão, nas cores oficiais (verde-escuro/lima) — ver
    `src/components/map/MapView.tsx`. A etiqueta de preço (zoom alto) não mudou, pois o preço é texto
    dinâmico, não dá pra vir de um PNG estático.
  - `18_marcadores/localizacao.png` — **não usado**: é um pin estático sem capacidade de indicar
    direção; o marcador de posição do usuário precisa girar pra mostrar o rumo (seta tipo GPS/Waze),
    então o círculo+seta SVG atual continua sendo a implementação certa — essa imagem não serve pra
    substituí-lo sem perder essa função.
  - `18_marcadores/rota.png` e `18_marcadores/raio_busca.png` — **não são marcadores de ponto**: a
    arte é uma linha tracejada e círculos concêntricos (ilustração/legenda do conceito, não um ícone
    pra plotar numa coordenada) — não implementado.
  - `18_marcadores/destaque.png` (pin laranja com estrela): não implementado — não existe hoje um
    conceito de "imóvel em destaque/patrocinado" diferente de "oportunidade" (que já tem seu próprio
    tratamento visual); introduzir esse estado seria uma funcionalidade nova, não pedida.
  - `08_marcos` (Alto da Sé, Forte de Casa Caiada, Marco Zero): não são uma classe genérica do OSM;
    precisam de uma camada própria com coordenadas reais verificadas (não inventar coordenadas).
  - `04_imoveis`/`16_urbanismo` (ícones por tipo de imóvel): mais prováveis de servir o card de imóvel
    ou o seletor de tipo em `/anunciar` do que o mapa em si.
  - `05_vegetacao`/`14_natureza`/`17_infraestrutura`: o `LEIA-ME.txt` da própria biblioteca avisa que
    ruas, água e terrenos reais devem continuar vindo da geometria do mapa — essas imagens são
    referência ilustrativa, não dado geográfico; precisam de uma decisão de design antes de qualquer
    implementação (não renderizar como se fosse geometria real).
  - `19_vegetacao_guia` a `24_ui_guia` (47 itens): pela nomenclatura, parecem referência/legenda, não
    elementos para renderizar no mapa ao vivo — não auditado a fundo ainda.
- O estilo satélite (`SATELLITE_STYLE`, imagens Esri) não foi alterado — é uma camada alternativa, não o
  modo padrão.

### Pills de POI próximo (briefing visual "Moraí Maps", 2026-11-27)

O usuário mandou 3 mockups mostrando um estilo bem mais ilustrado/denso que o mapa vetorial real
permite (árvore/prédio cobrindo cada quarteirão — inviável a partir de dados reais do OSM, que não
tem posição de árvore individual, sem um projeto de tiles raster customizados à parte). Da parte
viável, a primeira peça implementada foi os **pills de POI próximo com ícone + nome + distância**
(ex. "Farmácia · 300 m"), iguais ao mockup 1.

- `src/components/map/MapView.tsx`: busca POIs reais perto da posição atual via `/api/poi`
  (Overpass/OpenStreetMap, a mesma API já usada em `NearbyPOISection` no detalhe do imóvel) e
  renderiza até `MAX_POI_PILLS` (4) como marcadores HTML — só o mais próximo de cada categoria em
  `MAP_POI_CATEGORIES` (mesma curadoria de `NearbyPOISection`: farmácia, supermercado, escola,
  restaurante, ponto de ônibus, praia, academia, banco).
- **Throttle obrigatório**: só busca de novo quando o usuário anda mais de
  `POI_REFETCH_DISTANCE_METERS` (150m) desde a última consulta — a Overpass é uma API gratuita de
  uso justo, não dá pra consultar a cada atualização de GPS. Testado injetando POIs falsos (mock de
  `fetch`) porque a Overpass pública esteve indisponível durante o teste local.
  - Ícones reaproveitam os mesmos componentes lucide-react de `POI_ICONS`
    (`src/lib/data/poiIcons.ts`), pré-renderizados pra SVG estático sob demanda
    (`renderToStaticMarkup`) e com cache — **importante**: isso não pode rodar no topo do módulo
    (quebra o prerender estático do Next.js com "Cannot read properties of null (reading
    'useContext')"), só dentro de uma função chamada em tempo de render/efeito no cliente.
  - Pills somem sozinhas quando a localização fica indisponível (`userPosition` nulo).
- **Não implementado**: as pills não são clicáveis (`pointer-events: none`, só informativas, iguais
  ao mockup) e não mostram todas as categorias — isso é intencional, pra não poluir o mapa.

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

1. **Design system, identidade visual, tipografia, botões, cabeçalho, navegação inferior** — feito:
   tipografia (Plus Jakarta Sans), os 3 níveis de botão (principal lima, secundário verde-escuro,
   terciário contorno) e `MoraiHeader` (painel sólido com curva orgânica) no mapa. Navegação
   inferior já batia com a referência (selo lima na aba ativa) e não precisou de mudança.
2. Estilo cartográfico "Moraí Claro", marcadores de preço, localização do usuário, botões
   flutuantes, filtros rápidos e cartão inferior do imóvel — **parcial**: marcador selecionado em
   lima, botões flutuantes reorganizados (filtros virou flutuante, saiu da busca) e chips de filtro
   rápido funcionais já feitos; falta o estilo cartográfico "Moraí Claro" (a maior pendência — o
   briefing pede atenção especial a essa seção) e o redesenho do cartão inferior do imóvel.
3. Configuração do Modo Passeio, alertas de proximidade, filtros avançados — **ainda não feito**.
4. Detalhes dos imóveis, favoritos, comparação, custo real de morar — **ainda não feito**.
5. POIs ilustrados, mapa 3D, tema noturno, microinterações avançadas — **ainda não feito**.

Itens 2–5 ficam registrados como próxima fase no [ROADMAP.md](ROADMAP.md), um de cada vez, em vez de
uma reforma visual completa de uma vez só (risco de regressão alto sem revisar tela por tela).

## "O Moraí É o modo passeio" — alteração fundamental de conceito (briefing 2026-11-27)

Um segundo briefing, explicitamente dito como substituto de qualquer instrução anterior que tratasse
"Modo Passeio" como uma funcionalidade separada e opcional, pediu que a descoberta geolocalizada seja
o comportamento padrão do app, sem botão de "iniciar". Ao investigar, a maior parte disso já estava
implementada numa etapa anterior desta mesma sessão:

- `useModoPasseio` já roda descoberta/alerta/câmera-seguindo incondicionalmente (sem flag de
  ativação) desde que há posição do usuário + imóveis carregados — ver nota em
  [ARCHITECTURE.md](ARCHITECTURE.md).
- Não existe nenhum botão "iniciar passeio" em nenhuma tela.
- O selo de status flutuante no mapa foi revisado pra mostrar sempre texto real do estado atual
  ("Localizando você…", "Localização indisponível", "N imóvel(is) por perto"), nunca uma legenda
  fictícia de "modo ativado".
- Os dois modos de câmera (seguir automaticamente vs. explorar livremente arrastando o mapa) já
  existem via `followPaused`/`resumeFollow` em `MapView.tsx`.
- "Modo Passeio" foi renomeado para **Minha Busca** no texto visível ao usuário (Perfil, Privacidade,
  Termos) — o nome interno do hook/pasta (`passeio`) ficou como está, por ser detalhe de
  implementação, não UI.

Duas perguntas do briefing foram levadas ao usuário e respondidas (confirmando o estado atual, sem
necessidade de mudança de código):

- **Aba "Explorar" na navegação inferior**: mantida como está. Não é redundante com o mapa — é uma
  visão em lista por bairro, com carrossel de oportunidades do Moraí Radar e atalho pro Bairro Ideal,
  nada disso coberto pela descoberta automática do mapa.
- **Navegação externa (Apple/Google Maps/Waze)**: confirmado que continua desativada — o Moraí
  permanece como a única plataforma de navegação do app, decisão já tomada e publicada antes neste
  mesmo briefing de redesign.

## Acessibilidade e contraste

- Textos sobre fundo escuro usam `--color-off-white`; textos sobre lima/esmeralda usam
  `--color-dark-green` para manter contraste adequado (nunca texto escuro sobre fundo escuro ou
  vice-versa).
- Toda ação destrutiva ou importante (remover favorito, apagar dados locais) usa confirmação ou cor de
  alerta (`--color-danger`/`--color-warning`).
