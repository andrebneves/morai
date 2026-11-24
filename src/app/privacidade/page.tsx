import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background px-5 pb-16 pt-safe">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/perfil"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-lg font-bold">Política de Privacidade</h1>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-text-muted">
        <p>
          O Moraí (versão Beta 1.0) é um aplicativo de demonstração de descoberta imobiliária por
          geolocalização. Esta política explica, de forma simples, como tratamos seus dados.
        </p>
        <h2 className="font-semibold text-foreground">Localização</h2>
        <p>
          Sua localização é usada apenas no seu dispositivo, para centralizar o mapa e calcular distâncias
          até imóveis e pontos de interesse. Não enviamos sua localização para nossos servidores, exceto
          quando você ativa o Modo Passeio, cujos dados de deslocamento não são armazenados sem seu
          consentimento explícito e não são compartilhados com terceiros.
        </p>
        <h2 className="font-semibold text-foreground">Dados salvos localmente</h2>
        <p>
          Favoritos, filtros, preferências de tema e imóveis cadastrados (quando o Supabase não está
          configurado) ficam salvos apenas no armazenamento local do seu navegador. Você pode apagá-los a
          qualquer momento na tela de Perfil.
        </p>
        <h2 className="font-semibold text-foreground">Conta e cadastro de imóveis</h2>
        <p>
          Quando o Supabase está configurado, imóveis cadastrados por você ficam vinculados à sua conta e
          passam por moderação antes de aparecerem publicamente. Você pode solicitar a exclusão da sua
          conta e dos seus dados a qualquer momento.
        </p>
        <h2 className="font-semibold text-foreground">Dados de terceiros</h2>
        <p>
          Usamos dados abertos do OpenStreetMap (mapas e pontos de interesse) e fotos de banco de imagens
          gratuito (Unsplash, sob a Unsplash License) nos imóveis demonstrativos, apenas para fins
          ilustrativos nesta versão beta — essas fotos não retratam os endereços fictícios do seed.
        </p>
        <h2 className="font-semibold text-foreground">LGPD</h2>
        <p>
          Em conformidade com a Lei Geral de Proteção de Dados, você tem direito a acessar, corrigir e
          excluir seus dados pessoais. Entre em contato através do formulário de feedback do app.
        </p>
      </div>
    </div>
  );
}
