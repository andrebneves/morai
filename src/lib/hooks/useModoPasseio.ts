"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/lib/types";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { haversineMeters, formatDistanceFalada } from "@/lib/geo";
import { formatPrecoFalado } from "@/lib/format";

export type RaioPasseio = 100 | 250 | 500 | 1000 | 2000;
export type ModoDeslocamento = "pe" | "carro";

export interface ImovelProximo {
  property: Property;
  distanciaMetros: number;
}

const ALERTA_COOLDOWN_MS = 1000 * 60 * 10; // não repete o mesmo imóvel por 10 min

export function useModoPasseio(properties: Property[]) {
  const [active, setActive] = useState(false);
  const [raioMetros, setRaioMetros] = useState<RaioPasseio>(250);
  const [modo, setModo] = useState<ModoDeslocamento>("pe");
  const [somAtivo, setSomAtivo] = useState(true);
  const [ultimoAlerta, setUltimoAlerta] = useState<ImovelProximo | null>(null);

  const { position, permission, requestOnce } = useGeolocation({ watch: active });
  const announced = useRef<Map<string, number>>(new Map());

  const falar = useCallback(
    (texto: string) => {
      if (!somAtivo) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;

      const speak = () => {
        const utter = new SpeechSynthesisUtterance(texto);
        utter.lang = "pt-BR";
        utter.rate = 0.95;
        // Em alguns navegadores (Safari/iOS) a `lang` sozinha não garante a voz certa —
        // sem escolher explicitamente uma voz pt-BR, pode cair numa voz padrão (geralmente
        // em inglês) que lê o português de forma estranha/errada.
        const vozes = synth.getVoices();
        const vozPt =
          vozes.find((v) => v.lang === "pt-BR") ??
          vozes.find((v) => v.lang?.toLowerCase().startsWith("pt")) ??
          null;
        if (vozPt) utter.voice = vozPt;
        synth.speak(utter);
      };

      if (synth.getVoices().length > 0) {
        speak();
        return;
      }
      // A lista de vozes às vezes só fica disponível de forma assíncrona (evento
      // "voiceschanged"), especialmente na primeira vez que a página usa fala.
      let jaFalou = false;
      const aoCarregarVozes = () => {
        if (jaFalou) return;
        jaFalou = true;
        synth.removeEventListener("voiceschanged", aoCarregarVozes);
        speak();
      };
      synth.addEventListener("voiceschanged", aoCarregarVozes);
      setTimeout(() => {
        if (jaFalou) return;
        jaFalou = true;
        synth.removeEventListener("voiceschanged", aoCarregarVozes);
        speak();
      }, 300);
    },
    [somAtivo],
  );

  const nearby: ImovelProximo[] = useMemo(() => {
    if (!position) return [];
    return properties
      .map((property) => ({
        property,
        distanciaMetros: haversineMeters(position, { lat: property.lat, lng: property.lng }),
      }))
      .filter((p) => p.distanciaMetros <= raioMetros)
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  }, [position, properties, raioMetros]);

  useEffect(() => {
    if (!active || nearby.length === 0) return;
    const now = Date.now();
    const novo = nearby.find((n) => {
      const last = announced.current.get(n.property.id);
      return !last || now - last > ALERTA_COOLDOWN_MS;
    });
    if (novo) {
      announced.current.set(novo.property.id, now);
      setUltimoAlerta(novo);
      const finalidade = novo.property.finalidade === "venda" ? "à venda" : "para alugar";
      const porMes = novo.property.finalidade === "aluguel" ? " por mês" : "";
      falar(
        `Imóvel ${finalidade} a ${formatDistanceFalada(novo.distanciaMetros)} de você, por ${formatPrecoFalado(novo.property.preco)}${porMes}.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby, active]);

  const start = useCallback(() => {
    requestOnce();
    setActive(true);
  }, [requestOnce]);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  const testarAlerta = useCallback(() => {
    falar("Este é um alerta de teste do modo passeio do Moraí.");
  }, [falar]);

  return {
    active,
    start,
    stop,
    raioMetros,
    setRaioMetros,
    modo,
    setModo,
    somAtivo,
    setSomAtivo,
    position,
    permission,
    nearby,
    ultimoAlerta,
    testarAlerta,
  };
}
