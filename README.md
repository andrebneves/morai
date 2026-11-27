# moraí. — o GPS do mercado imobiliário

> Sua próxima casa pode estar na próxima esquina.

Moraí é um PWA (Progressive Web App) de descoberta imobiliária por geolocalização, focado na fase de
testes em **Olinda, Pernambuco**. Esta é a versão **Beta 1.0**: um app mapa-cêntrico, instalável no
iPhone/Android sem precisar de App Store, Mac ou conta de desenvolvedor Apple.

**Princípio fundamental do produto**: o Moraí não é um app imobiliário que tem um mapa — é um GPS que
é especializado em imóveis. Por isso a descoberta geolocalizada (acompanhar a posição do usuário,
avisar de imóveis compatíveis por perto, guiar até o imóvel escolhido pelas ruas) é o comportamento
padrão do app desde que o mapa abre, sem nenhum botão de "iniciar". A configuração disso (raio, modo de
deslocamento, perfis de busca salvos) chama-se **Minha Busca** — não é uma funcionalidade separada que
precisa ser ativada, só os ajustes de como a busca sempre ativa funciona.

Esta versão roda em **modo demonstrativo** por padrão (100 imóveis fictícios gerados com seed
reproduzível) e funciona inteiramente sem backend. Ao configurar um projeto Supabase (opcional), o app
passa a usar banco de dados compartilhado real, autenticação e upload de fotos — ver [DATABASE.md](DATABASE.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** (tokens de design em `src/app/globals.css`)
- **MapLibre GL JS** com tiles do [OpenFreeMap](https://openfreemap.org) (ruas) e Esri World Imagery (satélite) — sem necessidade de API key
- **Supercluster** para clustering de marcadores
- **Zustand** (com `persist`) para estado do cliente (favoritos, comparador, filtros, tema)
- **Framer Motion** para bottom sheets e transições
- **Supabase** (Postgres + PostGIS + Auth + Storage) — opcional, com fallback total para `localStorage`
- **Nominatim** (geocodificação) e **Overpass API** (pontos de interesse) — dados abertos do OpenStreetMap

Nenhum serviço pago é usado nesta fase. Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalhes.

## Rodando localmente

```powershell
npm install
npm run dev
```

Abra `http://localhost:3000`. Sem nenhuma variável de ambiente configurada, o app roda 100% em modo
demonstrativo (os 100 imóveis ficam em `src/lib/data/properties.json`, cadastros novos ficam em
`localStorage` do navegador).

### Gerando os dados de demonstração novamente

```powershell
npm run seed:generate
```

Regenera `src/lib/data/properties.json` de forma determinística (mesma seed = mesmo resultado),
respeitando a distribuição exata de 100 imóveis por bairro definida no briefing do produto.

### Gerando os ícones do PWA

```powershell
npm run icons:generate
```

Rasteriza a marca (`src/components/icons/LogoMark.tsx`) em todos os tamanhos de ícone/splash screen
necessários, salvando em `public/icons/` e `public/splash/`.

## Build e deploy

```powershell
npm run build
npm run start
```

O projeto está pronto para deploy na [Vercel](https://vercel.com) (zero config). Ver seção de deploy em
[ARCHITECTURE.md](ARCHITECTURE.md#deploy).

## Configurando o Supabase (opcional, recomendado para uso real)

Sem isso o app funciona, mas cada usuário só vê os imóveis que ele mesmo cadastrou (salvos no
`localStorage` do próprio navegador/dispositivo). Para ter um banco compartilhado entre todos os
usuários (necessário para o teste de rua com várias pessoas), siga o passo a passo em
[DATABASE.md](DATABASE.md).

## Instalando no iPhone (PWA)

1. Abra a URL do Moraí no **Safari** (precisa ser Safari, não funciona pelo app de outro navegador no iOS).
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. Abra o Moraí pelo ícone na tela de início — ele abre em tela cheia, como um app nativo.

## Instalando no Android

1. Abra a URL no Chrome.
2. Toque no banner "Instalar app" (se aparecer) ou no menu (⋮) → "Instalar aplicativo".

## Documentação

- [ROADMAP.md](ROADMAP.md) — o que está implementado, em progresso e planejado
- [TASKS.md](TASKS.md) — checklist de tarefas desta fase
- [ARCHITECTURE.md](ARCHITECTURE.md) — decisões técnicas e estrutura do projeto
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — identidade visual, cores, tipografia, componentes
- [DATABASE.md](DATABASE.md) — configuração do Supabase, schema, RLS
- [CLAUDE.md](CLAUDE.md) — guia para trabalhar neste repositório com Claude Code
- `.env.example` — variáveis de ambiente necessárias

## Aviso importante

Esta é uma versão **Beta 1.0** de testes. A maioria dos imóveis exibidos são **fictícios e claramente
identificados como "Demonstrativo"** — não representam imóveis reais à venda ou para locação. Calculadoras
de financiamento e custo de morar são estimativas simplificadas e não constituem proposta bancária.
