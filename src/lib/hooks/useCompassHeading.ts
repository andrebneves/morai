"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CompassPermissionState = "idle" | "prompt" | "granted" | "denied" | "unsupported";

// Safari no iOS expõe `webkitCompassHeading` no evento (graus no sentido horário a partir do
// norte verdadeiro — é a bússola "de verdade"). Outros navegadores só têm `alpha`, que é relativo
// à orientação inicial do aparelho, não ao norte — não dá pra confiar nele como bússola.
interface WebkitDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/** Rumo (0-360°, 0 = norte) pra onde o aparelho está apontando, usando a bússola real do
 * dispositivo quando disponível (iOS Safari). Pede permissão explicitamente — no iOS isso só
 * funciona chamado a partir de um gesto do usuário (ex.: clique num botão "Ativar"). */
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<CompassPermissionState>("idle");
  const semSinalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOrientation = useCallback((event: Event) => {
    const e = event as WebkitDeviceOrientationEvent;
    if (semSinalRef.current) {
      clearTimeout(semSinalRef.current);
      semSinalRef.current = null;
    }
    if (typeof e.webkitCompassHeading === "number") {
      setHeading(e.webkitCompassHeading);
      setPermission("granted");
      return;
    }
    if (e.alpha !== null && e.absolute) {
      // Só confiamos em `alpha` quando o navegador marca `absolute: true` (orientação relativa
      // ao mundo real, não ao estado inicial do aparelho).
      setHeading((360 - e.alpha) % 360);
      setPermission("granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setPermission("unsupported");
      return;
    }
    const DOE = DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
    try {
      if (typeof DOE.requestPermission === "function") {
        const result = await DOE.requestPermission();
        if (result !== "granted") {
          setPermission("denied");
          return;
        }
      }
      setPermission("prompt");
      window.addEventListener("deviceorientationabsolute", handleOrientation, true);
      window.addEventListener("deviceorientation", handleOrientation, true);
      // Se nenhum evento com rumo utilizável chegar em alguns segundos (comum em desktop e em
      // alguns Androids sem magnetômetro), avisa que a bússola não está disponível em vez de
      // deixar a tela travada num estado de carregamento eterno.
      semSinalRef.current = setTimeout(() => {
        setPermission((atual) => (atual === "granted" ? atual : "unsupported"));
      }, 4000);
    } catch {
      setPermission("denied");
    }
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
      if (semSinalRef.current) clearTimeout(semSinalRef.current);
    };
  }, [handleOrientation]);

  return { heading, permission, requestPermission };
}
