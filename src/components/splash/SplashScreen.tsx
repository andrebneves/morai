"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/icons/LogoMark";

interface SplashScreenProps {
  fadingOut?: boolean;
}

/** Tela de abertura rápida (estilo Waze/Google Maps) mostrada por um instante antes do app
 * ficar pronto — ver `useSplashGate` para o controle de duração mínima + fade-out. O pin "cai"
 * no lugar como um marcador de GPS e um sinal de localização pulsa atrás dele em loop. */
export function SplashScreen({ fadingOut = false }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-dark-green text-off-white transition-opacity duration-300 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="animate-pulse-ring absolute h-14 w-14 rounded-full bg-emerald/40" />
        <span className="animate-pulse-ring absolute h-14 w-14 rounded-full bg-emerald/40 [animation-delay:0.9s]" />
        <div className="animate-morai-drop relative">
          <LogoMark size={56} variant="light" />
        </div>
      </div>
      <span className="font-display text-2xl font-extrabold tracking-tight lowercase text-off-white">
        moraí<span className="text-lime">.</span>
      </span>
    </div>
  );
}

/** Mantém a splash visível por pelo menos `minMs`, mesmo se `ready` ficar true antes disso,
 * e dispara um fade-out curto em vez de sumir abruptamente. */
export function useSplashGate(ready: boolean, minMs = 650) {
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), minMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && minTimeDone && !fading) setFading(true);
  }, [ready, minTimeDone, fading]);

  // Efeito separado do de cima: se os dois dependessem de `fading` no mesmo useEffect, o
  // cleanup disparado pela própria mudança de `fading` cancelava este timeout antes de rodar.
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setShow(false), 280);
    return () => clearTimeout(t);
  }, [fading]);

  return { show, fading };
}
