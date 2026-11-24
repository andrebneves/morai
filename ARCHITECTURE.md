# Arquitetura — Moraí

## Visão geral

Moraí é um Next.js App Router, quase inteiramente renderizado no cliente (`"use client"`), estruturado
para funcionar **com ou sem backend**:

- **Sem Supabase configurado** (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` ausentes):
  modo demonstrativo. Imóveis vêm de `src/lib/data/properties.json` (seed estática, 100 imóveis).
  Cadastros feitos pelo usuário em `/anunciar` são salvos em `localStorage`
  (`morai:local-submissions:v1`) e mesclados com o seed em tempo de leitura.
- **Com Supabase configurado**: imóveis vêm da tabela `properties` (ver [DATABASE.md](DATABASE.md)),
  cadastros novos entram com `status = 'pendente'` até aprovação no painel admin, e ficam visíveis a
  todos os usuários (banco compartilhado) assim que aprovados.

Essa dualidade é resolvida em um único ponto: `src/lib/data/properties.ts` (`getAllProperties()`), de
forma que o resto do app nunca precisa saber qual fonte de dados está ativa.

## Estrutura de pastas

```
src/
  app/                      # Rotas (App Router)
    page.tsx                # Onboarding inicial + redirecionamento
    mapa/                   # Mapa principal (GPS imobiliário)
    explorar/               # Lista/grade de imóveis com filtros
    imovel/[id]/            # Detalhe do imóvel
    anunciar/               # Cadastro de imóvel real
    favoritos/              # Imóveis salvos
    comparar/               # Comparador (até 4 imóveis)
    bairro-ideal/           # "Meu Bairro Ideal" — scoring por bairro
    perfil/                 # Tema, feedback, instalação, privacidade
    drive/                  # "Moraí Drive" — mockup conceitual CarPlay/Android Auto
    admin/                  # Painel administrativo (moderação)
    privacidade/, termos/   # Páginas legais
    offline/                # Fallback do Service Worker
    api/poi/route.ts        # Proxy para a Overpass API (pontos de interesse)
    manifest.ts             # Web App Manifest (PWA)
    globals.css             # Design tokens + Tailwind v4
  components/
    map/                    # MapView (MapLibre), busca, toggle comprar/alugar
    property/               # Card, galeria, calculadoras, POIs próximos, rotas
    passeio/                # Modo Passeio (bottom sheet)
    filters/                # Sheet de filtros avançados
    onboarding/, layout/, pwa/, ui/, icons/
  lib/
    types.ts                # Tipos de domínio (Property, POI, RadarResult, ...)
    data/                   # Seed, bairros de Olinda, categorias de POI, feedback
    hooks/                  # useGeolocation, useModoPasseio, useNearbyPOIs, useRadarMap
    store/useAppStore.ts    # Zustand (favoritos, comparador, filtros, tema, onboarding)
    supabase/               # Clientes Supabase (client/server), null-safe
    radar.ts, financing.ts, geo.ts, format.ts, applyFilters.ts
scripts/
  generate-seed.mjs         # Gera os 100 imóveis demonstrativos (determinístico)
  generate-icons.mjs        # Gera ícones/splash screens do PWA via sharp
  seed-supabase.mjs         # Envia o seed para um projeto Supabase real
  copy-maplibre-worker.mjs  # Copia o worker do MapLibre para public/ (necessário p/ Turbopack)
supabase/schema.sql         # Schema Postgres + PostGIS + RLS
public/                     # Ícones, splash screens, service worker (sw.js), worker do MapLibre
```

## Decisões técnicas e por quê

- **MapLibre GL JS + OpenFreeMap/Esri**, em vez de Mapbox GL JS: evita a necessidade de token/API key
  paga nesta fase de testes, respeitando a exigência de não contratar serviços pagos sem autorização.
  MapLibre é um fork open-source de Mapbox GL JS v1, com API quase idêntica — a migração futura para
  Mapbox (se desejado) é de baixo esforço.
- **Worker do MapLibre copiado para `public/`**: o carregamento "self-referencing" padrão do worker do
  MapLibre não funciona com o dev server do Turbopack (serve como `text/html` em vez de JS). O script
  `scripts/copy-maplibre-worker.mjs` roda em `predev`/`prebuild` e copia o arquivo `.mjs` real para
  `public/maplibre-gl-worker.mjs`, e `MapView.tsx` aponta `setWorkerUrl()` para ele.
- **Clustering client-side com Supercluster**, renderizado via marcadores HTML (não GL layers), para
  ter controle total do design dos pins (pill de preço, badge de oportunidade) sem WebGL custom layers.
- **Nominatim com rate-limit de 1.1s e User-Agent genérico**: respeita a política de uso justo do
  Nominatim/OpenStreetMap (máx. 1 req/s) e nunca expõe identidade pessoal do desenvolvedor em headers
  HTTP enviados a terceiros.
- **Overpass API via Route Handler próprio** (`/api/poi`): evita problemas de CORS, permite timeout
  curto (12s) com fallback gracioso (retorna `{ pois: [], aviso: "..." }` em vez de erro), e esconde
  qual mirror do Overpass está sendo usado.
- **"Meu Bairro Ideal" calcula por bairro, não por imóvel**: com 17 bairros e até 8 categorias de POI,
  isso significa no máximo 17 chamadas à Overpass por cálculo (uma por bairro, com todas as categorias
  combinadas em uma única query), em vez de uma chamada por imóvel exibido — essencial para não
  sobrecarregar a API pública.
- **Zustand com `persist`** em vez de Context API: estado do cliente (favoritos, filtros, tema,
  comparador) precisa sobreviver a reloads e ser lido fora de componentes React (ex.: ao montar o mapa).
- **Supabase clients "null-safe"**: `isSupabaseConfigured()` checa as env vars antes de qualquer uso;
  todo código que depende do Supabase usa `supabase?.algo` ou checa `isSupabaseConfigured()` primeiro,
  nunca assume que o cliente existe. Isso é o que permite o app funcionar 100% sem backend.
- **RLS (Row Level Security)** ativado em todas as tabelas Supabase desde o primeiro schema — nunca
  houve uma versão sem RLS.

## Fluxo de dados de um imóvel

1. **Demo**: gerado por `scripts/generate-seed.mjs` → `src/lib/data/properties.json` → lido por
   `getAllProperties()`.
2. **Cadastrado (sem Supabase)**: formulário em `/anunciar` → `saveLocalSubmission()` →
   `localStorage['morai:local-submissions:v1']` → mesclado em `getAllProperties()`.
3. **Cadastrado (com Supabase)**: formulário em `/anunciar` → insert na tabela `properties` com
   `status: 'pendente'` → aparece no painel `/admin` para o admin aprovar → `status: 'disponivel'` →
   visível para todos via `getAllProperties()` (que filtra `status = 'disponivel'` para usuários
   normais).

## Deploy

Recomendado: **Vercel** (free tier), que serve Next.js nativamente.

```powershell
npm run build   # valida localmente antes de subir
```

1. Suba o repositório para o GitHub.
2. Importe o repositório na Vercel (vercel.com/new).
3. Configure as variáveis de ambiente do `.env.example` no painel da Vercel (se for usar Supabase).
4. Deploy automático a cada push na branch principal.

A URL pública gerada pela Vercel (`https://<projeto>.vercel.app`) funciona mesmo com o computador do
desenvolvedor desligado — é isso que permite instalar o PWA no iPhone e testar nas ruas de Olinda.

## Limitações conhecidas desta fase

- Sem Supabase configurado, cada dispositivo só enxerga seus próprios cadastros (não há banco
  compartilhado real) — ver [DATABASE.md](DATABASE.md) para resolver isso.
- A Overpass API é um serviço público e pode ficar temporariamente indisponível ou lenta; o app degrada
  graciosamente (mostra avisos em vez de travar), mas funcionalidades que dependem dela (POIs próximos,
  Meu Bairro Ideal) ficam limitadas nesses momentos.
- O Modo Passeio não funciona em segundo plano nem com a tela bloqueada no iOS — é uma limitação do
  Safari/PWA, não do código do Moraí, e é comunicada explicitamente ao usuário na própria tela.
- "Moraí Drive" é uma tela conceitual (mockup), não uma integração real com CarPlay/Android Auto.
