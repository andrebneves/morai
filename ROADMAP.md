# Roadmap — Moraí

## ✅ Implementado (Beta 1.0 — esta versão)

- Identidade visual completa (logo, cores, tipografia, temas claro/escuro)
- Onboarding inicial com pedido de permissão de localização
- Mapa interativo em tela cheia (MapLibre GL JS): localização do usuário, zoom/rotação, recentralizar,
  camadas rua/satélite, busca de endereço/bairro
- Clustering de marcadores com Supercluster
- 140 imóveis demonstrativos: 100 distribuídos pelos 17 bairros de Olinda (contagem exata definida
  no briefing do produto) + 40 em Espinheiro e Ibura (Recife), adicionados a pedido pra sócios
  testarem o Moraí fora de Olinda também — coordenadas reais de cada bairro, nomes de rua reais
  desses bairros (endereço fictício, não corresponde a nenhum anúncio real de alguém), seed
  reproduzível (`npm run seed:generate`)
- Toggle Comprar / Alugar / Anunciar
- Página de detalhe do imóvel: galeria, especificações, descrição, histórico de preços, calculadoras,
  POIs próximos, rotas externas
- Filtros avançados (tipo, preço, área, quartos, banheiros, vagas, pet-friendly, condomínio fechado,
  piscina, varanda, quintal, elevador, acessibilidade, mobiliado, apenas oportunidades)
- **Modo Passeio Inteligente**: rastreamento de localização em tempo real, alerta de imóveis
  próximos por raio configurável (100 m–2 km), modo a pé/carro, voz em pt-BR, botão de teste de
  alerta; **perfis de busca salvos** (criar/usar/pausar/duplicar/excluir) com **filtros
  obrigatórios** (excluem o imóvel do alerta se não baterem: finalidade, tipo, preço máximo, área
  mínima, características) separados de **preferências desejáveis** (só pontuam um % de
  compatibilidade mostrado no alerta, não excluem nada)
- **Moraí Radar**: classificação de preço (muito abaixo / abaixo / dentro / acima / muito acima da
  mediana comparável), com gating por amostra mínima e aviso de dado demonstrativo
- 22 categorias de pontos de interesse via Overpass API, seção "O que tem por perto" no detalhe do
  imóvel
- **Meu Bairro Ideal**: pontuação de compatibilidade por bairro combinando POIs e características dos
  imóveis cadastrados
- Favoritos e comparador (até 4 imóveis)
- Fluxo completo de cadastro de imóvel (`/anunciar`), com upload de fotos via Supabase Storage quando
  configurado, e moderação (`pendente` → `disponivel`) no painel admin
- Calculadora de custo real de morar e simulador de financiamento (SAC/Price)
- Navegação própria do Moraí até o imóvel (GPS/rota pelas ruas, voz em pt-BR) — removida a opção de
  abrir Apple Maps/Google Maps/Waze: o Moraí é a própria plataforma de navegação, não um app
  imobiliário que delega "como chegar" a terceiros
- Zoom automático na localização do usuário já na abertura do mapa (antes só centralizava mantendo o
  zoom genérico da cidade)
- **Redesign "app de navegação imobiliário" (Prioridades 1 e 2 do briefing de direção de arte)**:
  tipografia Plus Jakarta Sans, cabeçalho `MoraiHeader` (painel sólido com curva orgânica),
  3 níveis de botão (principal lima, secundário verde-escuro, terciário contorno), chips de
  filtro rápido funcionais, marcador selecionado em lima, botão de filtros virou flutuante —
  ver seção dedicada em [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- "Moraí Drive" — mockup conceitual de integração CarPlay/Android Auto (claramente identificado como
  não-funcional/conceitual)
- PWA completo: manifest, service worker (cache network-first + stale-while-revalidate), ícones
  (incluindo maskable), splash screens, página offline, instalável sem Mac/App Store
- Painel administrativo (moderação de cadastros, métricas básicas)
- Sistema de feedback beta (sugestão, erro, problema de localização/instalação, funcionalidade desejada)
- Políticas de privacidade e termos de uso
- Modo demonstrativo completo (zero configuração) + modo com Supabase (banco compartilhado real)

## 🚧 Limitações conhecidas desta fase

- Sem um projeto Supabase configurado, cadastros ficam apenas no dispositivo local (não compartilhados)
- Modo Passeio não funciona em segundo plano/tela bloqueada no iOS (limitação do Safari/PWA, comunicada
  ao usuário)
- Dependência da Overpass API (serviço público, pode ficar temporariamente lenta/indisponível) para
  POIs e Meu Bairro Ideal
- Testado em navegador/emulação de viewport móvel; instalação física em iPhone ainda não verificada
  pelo time de desenvolvimento (ver TASKS.md)

## 🔮 Planejado para versões futuras (fora do escopo desta fase)

Estes itens foram intencionalmente **não implementados agora**, para priorizar o lançamento de uma
versão básica funcional, conforme instrução do briefing original:

- Moraí Match (recomendação estilo "match" entre perfil de busca e imóveis)
- Busca em linguagem natural assistida por IA
- Busca compartilhada em família/grupo
- Perfis de condomínio (regras, taxas, comodidades agregadas)
- Diário de visitas, checklist e agendamento de visitas
- Roteiro de visita com múltiplos imóveis (otimização de rota)
- Selo de anúncio verificado / verificação de corretores
- Detecção de anúncios duplicados
- Informações de risco ambiental/enchente, posição solar, Street View, tour virtual
- Mapas de calor de demanda
- Moraí Pro / CRM para corretores e imobiliárias
- Importação de anúncios via XML/CSV
- Relatórios de BI
- Apps nativos iOS/Android
- Integração real com CarPlay/Android Auto (hoje é só o mockup conceitual em `/drive`)
- Modelo de monetização
- **Moraí Vision**: câmera do celular sobrepondo, em tempo real, os imóveis à venda/aluguel de um
  edifício apontado (preço médio do m², condomínio, características, oportunidades abaixo da
  referência). Como PWA gratuita, só é viável numa versão simplificada — câmera + bússola/GPS
  posicionando rótulos por direção/distância (estilo "Layar"), sem reconhecer visualmente qual
  prédio é qual. Reconhecimento visual preciso do edifício exigiria app nativo (ARKit/ARCore) e/ou
  um serviço pago de posicionamento visual (VPS), fora do escopo gratuito desta fase.

### Do briefing estratégico "Dores, desejos e novas funcionalidades"

O briefing de produto recebido em 2026-11-27 (ver [MARKET_RESEARCH.md](MARKET_RESEARCH.md) pras
referências de mercado e dores/desejos mapeados) propõe uma visão bem mais ampla do Moraí, cobrindo
posicionamento, monetização, métricas e dezenas de funcionalidades novas. Por instrução explícita do
próprio briefing ("não tente implementar tudo simultaneamente") e da fase atual do projeto (Beta
1.0 — ver `CLAUDE.md`), isso **não foi implementado de uma vez**; só o item priorizado
explicitamente (Modo Passeio Inteligente, acima) entrou nesta rodada. Fica registrado aqui como
backlog de visão, pra priorização futura item a item:

- Moraí Match (recomendação "match" entre perfil de busca e imóveis — o embrião disso já existe no
  % de compatibilidade dos perfis do Modo Passeio Inteligente)
- Radar de Demanda / mapa de calor de interesse por região
- Moraí Bairro, Moraí Meu Lugar, Moraí Valor, Moraí Avalia (ferramentas de inteligência de bairro e
  precificação pro comprador/proprietário)
- Calculadora de Imóvel Parado (tempo/custo de vacância pro proprietário)
- Melhorias em Anunciar: indicadores de performance do anúncio, orientação de melhoria
- Moraí Confiança (verificação de corretores/anúncios — relacionado ao item "selo verificado" já
  listado acima)
- Moraí Pro (CRM de corretor) e Moraí Business (painel pra imobiliárias) — já havia "Moraí Pro / CRM"
  listado acima; o briefing detalha separadamente o lado "imobiliária"
- Busca por IA em linguagem natural e Busca em Família (já listados acima)
- Diário de Visitas (já listado acima)
- Modelo de monetização (o briefing é explícito: **sem cobrança nesta primeira versão**)
- Onboarding personalizado por perfil de uso
- Métricas de sucesso do produto — com a ressalva explícita do briefing de **não usar tracking
  invasivo nem guardar rotas precisas sem consentimento específico**
- Documentos de produto adicionais sugeridos pelo briefing (`CUSTOMER_DISCOVERY.md`,
  `PRODUCT_STRATEGY.md`, `BUSINESS_MODEL.md`, `COMPETITIVE_ANALYSIS.md`, `FEATURE_MATRIX.md`,
  `TEST_PLAN.md`) — ainda não criados; fazem sentido conforme cada frente acima for priorizada,
  não todos de uma vez

### Do briefing de direção de arte, design system e redesign da interface

Briefing recebido em 2026-11-27 com 7 imagens de referência e uma ordem de implementação em 5
níveis de prioridade definida pelo próprio briefing (ver seção "Direção de arte" em
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)). Prioridade 1 (design system, tipografia, botões, cabeçalho,
navegação inferior) foi implementada nesta rodada. Registrado aqui o que falta, exatamente nos
termos do briefing, pra priorização item a item nas próximas rodadas:

- **Prioridade 2 (parcial — feito: marcador selecionado em lima, botões flutuantes reorganizados
  com filtros entre eles, chips de filtro rápido funcionais)**: falta o estilo cartográfico
  "Moraí Claro" dedicado (hoje o mapa usa o estilo "Moraí Toy" já existente, não o especificado no
  briefing — essa é a maior pendência da Prioridade 2, o próprio briefing pede atenção especial a
  ela) e o redesenho do cartão inferior do imóvel (hoje ainda no visual anterior ao briefing,
  exceto o botão "Dirigir até lá" já corrigido pra verde-escuro)
- **Prioridade 3**: configuração do Modo Passeio, alertas de proximidade e filtros avançados — telas
  já funcionais, ainda no visual anterior ao briefing
- **Prioridade 4**: detalhes do imóvel, favoritos, comparação e calculadora de custo real de morar —
  idem
- **Prioridade 5**: pontos de interesse ilustrados no mapa, mapas tridimensionais, tema noturno
  dedicado e microinterações avançadas
- Biblioteca de ícones de POI customizados (só paisagens reais de Olinda, nunca inventadas)
- Validação visual formal: pasta de screenshots comparando cada tela redesenhada às 7 referências,
  em viewport iPhone 13 (pedido explícito do briefing) — feito informalmente nesta rodada (sem pasta
  dedicada ainda)
