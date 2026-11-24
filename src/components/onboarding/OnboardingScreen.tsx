"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/icons/Logo";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store/useAppStore";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { MapPin, Compass, ShieldCheck } from "lucide-react";

export function OnboardingScreen() {
  const router = useRouter();
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const { requestOnce, permission } = useGeolocation();
  const [requesting, setRequesting] = useState(false);

  const handleContinue = () => {
    setRequesting(true);
    requestOnce();
    setOnboarded(true);
    // Mesmo se a localização for negada, o app segue — mapa centraliza em Olinda.
    setTimeout(() => router.replace("/mapa"), 350);
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-green px-6 pt-safe pb-10 text-off-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <Logo size={56} variant="light" wordmarkClassName="text-3xl text-off-white" />

        <div className="animate-fade-in space-y-3">
          <h1 className="text-2xl font-extrabold leading-tight">
            Sua próxima casa pode
            <br />
            estar na próxima esquina.
          </h1>
          <p className="mx-auto max-w-xs text-sm text-off-white/70">
            O Moraí é o GPS do mercado imobiliário: descubra imóveis para comprar
            ou alugar enquanto você explora a cidade, a pé ou de carro.
          </p>
        </div>

        <div className="grid w-full max-w-xs gap-3 text-left">
          <Feature icon={<Compass className="h-4 w-4" />} text="Explore bairros reais de Olinda no mapa" />
          <Feature icon={<MapPin className="h-4 w-4" />} text="Veja imóveis próximos conforme você se desloca" />
          <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Sua localização só é usada no seu dispositivo" />
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleContinue}
          disabled={requesting}
        >
          {requesting ? "Abrindo o mapa…" : "Permitir localização e começar"}
        </Button>
        <button
          onClick={handleContinue}
          className="w-full py-2 text-center text-sm font-medium text-off-white/60"
        >
          Explorar sem compartilhar localização
        </button>
        {permission === "denied" && (
          <p className="text-center text-xs text-off-white/50">
            Sem problemas — o mapa abrirá centralizado em Olinda e você pode navegar manualmente.
          </p>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald/20 text-emerald">
        {icon}
      </span>
      <span className="text-sm text-off-white/85">{text}</span>
    </div>
  );
}
