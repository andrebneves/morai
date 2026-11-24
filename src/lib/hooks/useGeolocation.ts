"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
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
