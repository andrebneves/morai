import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Termos de Utilização" };

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background px-5 pb-16 pt-safe">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/perfil"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-lg font-bold">Termos de Utilização</h1>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-text-muted">
        <p>
          Ao usar o Moraí (versão Beta 1.0), você concorda com os termos abaixo. Esta é uma versão de
          testes e pode conter instabilidades, dados demonstrativos e funcionalidades incompletas.
        </p>
        <h2 className="font-semibold text-foreground">Imóveis demonstrativos</h2>
        <p>
          A maioria dos imóveis exibidos nesta versão são fictícios, criados apenas para fins de
          demonstração e teste do produto. Eles não representam imóveis reais à venda ou para locação e
          não devem ser usados para decisões financeiras.
        </p>
        <h2 className="font-semibold text-foreground">Cadastro de imóveis reais</h2>
        <p>
          Ao cadastrar um imóvel real, você declara ter autorização para anunciá-lo e se responsabiliza
          pela veracidade das informações fornecidas. O Moraí pode remover anúncios que violem estes
          termos ou a lei.
        </p>
        <h2 className="font-semibold text-foreground">Calculadoras e simulações</h2>
        <p>
          As calculadoras de custo de morar e de financiamento são estimativas simplificadas e
          educativas. Elas não constituem proposta bancária, aprovação de crédito ou aconselhamento
          financeiro.
        </p>
        <h2 className="font-semibold text-foreground">Limitação de responsabilidade</h2>
        <p>
          O Moraí é fornecido &quot;como está&quot;, sem garantias de disponibilidade contínua. Durante o
          uso do Moraí (Minha Busca), nunca utilize o celular enquanto dirige — use apenas os alertas
          sonoros.
        </p>
      </div>
    </div>
  );
}
