# Tasks — Beta 1.0

Checklist do que foi feito e do que falta para esta fase (desenvolvimento + publicação).

## Desenvolvimento

- [x] Setup do projeto (Next.js 16 + TypeScript + Tailwind v4)
- [x] Identidade visual e design tokens
- [x] Schema Supabase + RLS (ainda não aplicado em um projeto real — ver "Pendente")
- [x] Mapa interativo com MapLibre GL JS + clustering
- [x] Geolocalização (permissão, posição, rastreamento)
- [x] Seed de 100 imóveis demonstrativos (distribuição exata por bairro)
- [x] Página de detalhe + filtros avançados
- [x] Modo Passeio (raio configurável, voz pt-BR, alerta de teste)
- [x] 22 categorias de POI via Overpass API
- [x] Configuração completa de PWA (manifest, service worker, ícones, offline)
- [x] Favoritos e cadastro de imóvel (`/anunciar`)
- [x] Moraí Radar (classificação de preço)
- [x] Calculadoras (custo de morar, financiamento) + comparador
- [x] Meu Bairro Ideal
- [x] Painel administrativo
- [x] Sistema de feedback beta
- [x] Testes manuais end-to-end de todas as páginas no navegador (viewport móvel 375×812)
- [x] Correção de erros de build (TypeScript: tipos do Supercluster, callbacks do Supabase Auth)
- [x] Correção de bugs encontrados em teste manual:
  - botão de favoritar dentro de um card clicável navegava para o imóvel em vez de só favoritar
    (faltava `stopPropagation`)
  - calculadora "Custo real de morar" usava o preço total do imóvel como prestação mensal estimada em
    vez de uma estimativa de financiamento
  - imóveis cadastrados por usuários reais eram rotulados como "Demonstrativo" (deveria valer só para o
    seed)
  - "Meu Bairro Ideal" não avisava o usuário quando a Overpass API estava indisponível, mostrando 0% de
    compatibilidade para todos os bairros sem explicação
- [x] Documentação (README, ROADMAP, TASKS, ARCHITECTURE, DESIGN_SYSTEM, DATABASE, CLAUDE.md)
- [x] `git init` + commit inicial

## Pendente (depende de decisões/credenciais do usuário)

- [ ] Criar projeto no Supabase e configurar `.env.local` (ver [DATABASE.md](DATABASE.md)) — necessário
      para banco de dados compartilhado entre todos os usuários
- [ ] Criar repositório no GitHub e dar push
- [ ] Criar conta na Vercel e conectar o repositório para deploy
- [ ] Rodar `npm run seed:push` contra o projeto Supabase real
- [ ] Gerar QR code da URL pública final
- [ ] **Testar a instalação física no iPhone 13** — não realizado pelo assistente (sem acesso a
      dispositivo físico); precisa ser feito pelo usuário após o deploy
- [ ] Compartilhar com amigos para teste de rua em Olinda

## Notas de honestidade

- Nenhuma funcionalidade foi testada em um iPhone físico — todos os testes até aqui foram feitos em
  navegador desktop com emulação de viewport móvel (375×812, iPhone 13).
- Nenhum botão simulado existe sem estar claramente identificado como tal (ex.: "Moraí Drive" é
  explicitamente rotulado como mockup conceitual).
- Nenhum serviço pago foi contratado. Todos os serviços usados (OpenFreeMap, Esri World Imagery,
  Nominatim, Overpass API, Vercel free tier, Supabase free tier) são gratuitos nesta fase.
