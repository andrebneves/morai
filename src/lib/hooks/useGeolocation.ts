"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bearingDegrees, haversineMeters } from "@/lib/geo";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type GeoPermissionState = "idle" | "prompt" | "granted" | "denied" | "unsupported";

interface UseGeolocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
}

export function useGeolocation({ watch = false, enableHighAccuracy = true }: UseGeolocationOptions = {}) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [permission, setPermission] = useState<GeoPermissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // iOS/Android costumam devolver coords.heading = null quando parado ou em baixa
    // velocidade. Nesses casos, estimamos o rumo pela diferença entre as duas últimas
    // posições (como um GPS de navegação faria) e mantemos o último rumo conhecido
    // em vez de voltar para null, pra não fazer a seta "piscar" pra direção nenhuma.
    let heading = pos.coords.heading;
    if ((heading === null || Number.isNaN(heading)) && lastFixRef.current) {
      const moved = haversineMeters(lastFixRef.current, { lat, lng });
      heading = moved > 4 ? bearingDegrees(lastFixRef.current, { lat, lng }) : lastHeadingRef.current;
    }
    if (heading !== null) lastHeadingRef.current = heading;
    lastFixRef.current = { lat, lng };

    setPosition({
      lat,
      lng,
      accuracy: pos.coords.accuracy,
      heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    });
    setPermission("granted");
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setPermission("denied");
      setError("Localização não autorizada.");
    } else {
      setError("Não foi possível obter sua localização agora.");
    }
  }, []);

  const requestOnce = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 15000,
    });
  }, [enableHighAccuracy, handleError, handleSuccess]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      return;
    }

    if (!watch) return;

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, enableHighAccuracy, handleSuccess, handleError]);

  return { position, permission, error, requestOnce };
}
