# CLAUDE.md

Guia para trabalhar neste repositório com o Claude Code.

## O que é este projeto

Moraí é um PWA de descoberta imobiliária por geolocalização para Olinda, PE (ver [README.md](README.md)
para visão geral e [ARCHITECTURE.md](ARCHITECTURE.md) para decisões técnicas). Está na fase **Beta 1.0**:
prioridade é manter o app funcional, instalável e testável — não adicionar funcionalidades do
[ROADMAP.md](ROADMAP.md) "futuras" sem pedido explícito.

## Comandos

```powershell
npm run dev              # dev server (Turbopack)
npm run build             # build de produção (inclui type-check)
npm run lint               # eslint
npm run seed:generate      # regenera src/lib/data/properties.json (100 imóveis demonstrativos)
npm run seed:push          # envia o seed para um projeto Supabase real (precisa de .env.local)
npm run icons:generate      # regenera ícones/splash screens do PWA a partir do LogoMark
```

Sempre rode `npm run build` antes de considerar uma mudança concluída — o projeto usa TypeScript
estrito e o build falha em qualquer erro de tipo.

## Pontos de atenção específicos deste projeto

- **Next.js 16 breaking changes**: este projeto já leva isso em conta (`params`/`searchParams` são
  `Promise`, usar `use()` para desembrulhar em client components; `app/manifest.ts` segue a convenção
  `MetadataRoute.Manifest`). Se algo parecer "errado" comparado ao que você sabe de versões anteriores
  do Next.js, confira `node_modules/next/dist/docs/` antes de assumir que é um bug.
- **MapLibre GL JS** (`maplibre-gl` v6) só exporta nomeado — nunca `import maplibregl from "maplibre-gl"`.
  O worker precisa do arquivo copiado em `public/maplibre-gl-worker.mjs` (script
  `scripts/copy-maplibre-worker.mjs`, já ligado a `predev`/`prebuild`) — não remova essa etapa.
- **Nunca definir `el.style.transform` diretamente no elemento raiz de um `Marker` do MapLibre** — essa
  propriedade é usada internamente pela biblioteca para posicionar o marcador no mapa. Qualquer
  escala/transform visual deve ficar num `<div>` filho dentro do `innerHTML` do marcador (ver comentário
  em `src/components/map/MapView.tsx`).
- **Nunca envie a identidade pessoal do usuário** (email, nome) em headers HTTP, User-Agent ou qualquer
  requisição a serviços de terceiros (Nominatim, Overpass, etc.) — use sempre um identificador genérico
  de app, como já é feito em `scripts/generate-seed.mjs`.
- **Supabase é sempre opcional**: qualquer código novo que toque no Supabase deve checar
  `isSupabaseConfigured()` primeiro e ter um fallback funcional sem ele (localStorage, dado estático,
  ou simplesmente desabilitar a funcionalidade com uma mensagem clara). Nunca assuma que
  `getSupabaseBrowserClient()` retorna um cliente não-nulo.
- **Todo imóvel do seed tem `demo: true`; todo imóvel cadastrado por usuário real tem `demo: false`.**
  Qualquer UI que rotule um imóvel como "Demonstrativo" deve checar esse campo — nunca rotular
  incondicionalmente (já houve um bug exatamente desse tipo, corrigido — ver TASKS.md).
- **Nunca contratar ou configurar serviços pagos** (Mapbox com billing, planos pagos de Supabase/Vercel,
  etc.) sem autorização explícita do usuário. Esta fase usa exclusivamente tiers gratuitos.
- **Nunca simular um botão/funcionalidade sem rotular claramente que é conceitual** — ver `/drive`
  ("Moraí Drive") como exemplo do padrão esperado.
- **Nunca afirmar que algo foi testado em um iPhone físico** se o teste foi feito apenas em navegador
  com emulação de viewport — seja sempre explícito sobre o que foi/não foi verificado fisicamente.

## Testando mudanças de UI

Use o browser pane (`mcp__Claude_Browser__*`) com viewport emulado em 375×812 (iPhone 13) para validar
qualquer mudança visual ou de fluxo antes de considerá-la pronta. Prefira clicar por `ref` (via
`read_page`/`find`) em vez de coordenadas cruas — coordenadas de screenshot nem sempre batem 1:1 com a
posição real do elemento no DOM neste ambiente.

## Estrutura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para o mapa completo de pastas e decisões técnicas, e
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) para cores, tipografia e componentes.
