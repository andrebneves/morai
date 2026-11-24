"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return; // evita cache agressivo durante o dev

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Falha ao registrar service worker do Moraí", err);
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
