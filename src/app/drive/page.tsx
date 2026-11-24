"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Heart, Route, Settings, Phone, Music } from "lucide-react";
import { Logo } from "@/components/icons/Logo";

export default function DrivePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-graphite px-4 pb-10 pt-safe text-off-white">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Moraí Drive</h1>
      </div>

      <p className="mb-5 text-sm text-off-white/70">
        Demonstração conceitual de como o Moraí funcionará integrado ao Apple CarPlay e Android Auto.
        Esta tela é apenas uma simulação visual — a PWA não é executada diretamente dentro do CarPlay.
      </p>

      {/* Mock de central multimídia automotiva, proporção ~16:7 */}
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border-4 border-black/40 bg-black shadow-2xl" style={{ aspectRatio: "16/7.2" }}>
        <div className="flex h-full">
          <div className="flex w-16 flex-col items-center justify-between bg-[#0b0b0b] py-3">
            <Logo size={20} showWordmark={false} />
            <div className="flex flex-col items-center gap-4 text-white/60">
              <MapPin className="h-4 w-4 text-emerald" />
              <Music className="h-4 w-4" />
              <Phone className="h-4 w-4" />
            </div>
            <Settings className="h-4 w-4 text-white/40" />
          </div>
          <div className="relative flex-1 bg-gradient-to-br from-dark-green to-graphite">
            <div className="absolute left-3 top-2 text-[10px] text-white/50">10:24 · 4G</div>
            <div className="flex h-full flex-col justify-end p-3">
              <div className="mb-2 flex gap-1.5">
                <span className="rounded-full bg-emerald px-2 py-0.5 text-[9px] font-bold text-dark-green">R$ 480 mil</span>
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white/70">R$ 650 mil</span>
              </div>
              <div className="rounded-xl bg-black/50 p-2.5 text-[11px]">
                <p className="font-bold text-lime">Oportunidade a 150 metros</p>
                <p className="text-white/80">Casa · R$ 480 mil · 20% abaixo da referência</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md space-y-3">
        <FeatureRow icon={<MapPin className="h-4 w-4" />} text="Explorar imóveis próximos sem tirar os olhos da estrada" />
        <FeatureRow icon={<Route className="h-4 w-4" />} text="Rotas de visita com múltiplos imóveis" />
        <FeatureRow icon={<Heart className="h-4 w-4" />} text="Acesso rápido aos favoritos pelo volante" />
      </div>

      <p className="mx-auto mt-6 max-w-md rounded-xl bg-white/5 p-3 text-center text-xs text-off-white/60">
        Funcionalidade futura — ainda não disponível nesta versão beta. Hoje, você pode abrir a rota até um
        imóvel no Apple Maps e continuar a navegação pelo CarPlay do seu veículo.
      </p>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
      <span className="text-emerald">{icon}</span>
      <span className="text-sm text-off-white/85">{text}</span>
    </div>
  );
}
