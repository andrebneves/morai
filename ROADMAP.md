# Roadmap — Moraí

## ✅ Implementado (Beta 1.0 — esta versão)

- Identidade visual completa (logo, cores, tipografia, temas claro/escuro)
- Onboarding inicial com pedido de permissão de localização
- Mapa interativo em tela cheia (MapLibre GL JS): localização do usuário, zoom/rotação, recentralizar,
  camadas rua/satélite, busca de endereço/bairro
- Clustering de marcadores com Supercluster
- 100 imóveis demonstrativos distribuídos pelos 17 bairros de Olinda (contagem exata definida no
  briefing do produto), com coordenadas reais de cada bairro, seed reproduzível
  (`npm run seed:generate`)
- Toggle Comprar / Alugar / Anunciar
- Página de detalhe do imóvel: galeria, especificações, descrição, histórico de preços, calculadoras,
  POIs próximos, rotas externas
- Filtros avançados (tipo, preço, área, quartos, banheiros, vagas, pet-friendly, condomínio fechado,
  piscina, varanda, quintal, elevador, acessibilidade, mobiliado, apenas oportunidades)
- **Modo Passeio**: rastreamento de localização em tempo real, alerta de imóveis próximos por raio
  configurável (100 m–2 km), modo a pé/carro, voz em pt-BR, botão de teste de alerta
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
- Navegação externa (Apple Maps / Google Maps / Waze)
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
