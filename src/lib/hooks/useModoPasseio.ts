"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/lib/types";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { haversineMeters, bearingDegrees, formatDistanceFalada } from "@/lib/geo";
import { formatPrecoFalado } from "@/lib/format";
import { buscarRota, type ResultadoRota } from "@/lib/routing";

/** Abaixo desta distância consideramos que o usuário chegou ao destino escolhido. */
const RAIO_CHEGADA_METROS = 30;
/** Avisa a manobra em voz alta quando faltar essa distância pra ela. */
const RAIO_PRE_AVISO_METROS = 150;
/** Considera a manobra "feita" e passa pra próxima quando chegar perto assim dela. */
const RAIO_PASSO_CONCLUIDO_METROS = 20;

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
  const [destino, setDestinoState] = useState<Property | null>(null);
  const [rota, setRota] = useState<ResultadoRota | null>(null);
  const [rotaCarregando, setRotaCarregando] = useState(false);
  const [passoIndex, setPassoIndex] = useState(0);

  const { position, permission, requestOnce } = useGeolocation({ watch: active });
  const announced = useRef<Map<string, number>>(new Map());
  const chegadaAnunciada = useRef<string | null>(null);
  const rotaChaveRef = useRef<string | null>(null);
  const passoPreAvisadoRef = useRef<Set<number>>(new Set());

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

  // Guia o usuário até um imóvel escolhido usando o próprio GPS do Moraí — distância + rumo em
  // linha reta como ponto de partida, e uma rota real pelas ruas (com instruções por voz)
  // assim que a posição atual estiver disponível. "O navegador é o app": nunca manda abrir um
  // app de navegação externo.
  const setDestino = useCallback((property: Property | null) => {
    chegadaAnunciada.current = null;
    rotaChaveRef.current = null;
    passoPreAvisadoRef.current = new Set();
    setPassoIndex(0);
    setRota(null);
    setDestinoState(property);
  }, []);

  const distanciaDestino = useMemo(
    () => (position && destino ? haversineMeters(position, { lat: destino.lat, lng: destino.lng }) : null),
    [position, destino],
  );

  const rumoDestino = useMemo(
    () => (position && destino ? bearingDegrees(position, { lat: destino.lat, lng: destino.lng }) : null),
    [position, destino],
  );

  const chegouDestino = distanciaDestino !== null && distanciaDestino <= RAIO_CHEGADA_METROS;

  useEffect(() => {
    if (!destino || !chegouDestino) return;
    if (chegadaAnunciada.current === destino.id) return;
    chegadaAnunciada.current = destino.id;
    falar(`Você chegou perto de ${destino.titulo}.`);
  }, [destino, chegouDestino, falar]);

  // Busca a rota real pelas ruas (OSRM) uma vez por destino/modo de deslocamento — não refaz a
  // cada atualização de GPS pra não bater demais no servidor público gratuito. Se falhar (rede,
  // servidor fora do ar), fica sem rota e a UI cai de volta pro guia em linha reta.
  useEffect(() => {
    if (!destino || !position) return;
    const chave = `${destino.id}:${modo}`;
    if (rotaChaveRef.current === chave) return;
    rotaChaveRef.current = chave;
    passoPreAvisadoRef.current = new Set();
    setPassoIndex(0);
    setRotaCarregando(true);
    buscarRota(position, { lat: destino.lat, lng: destino.lng }, modo)
      .then((resultado) => setRota(resultado))
      .finally(() => setRotaCarregando(false));
  }, [destino, position, modo]);

  const passoAtual = rota && passoIndex < rota.passos.length ? rota.passos[passoIndex] : null;

  const distanciaProximoPasso = useMemo(
    () => (passoAtual && position ? haversineMeters(position, passoAtual.local) : null),
    [passoAtual, position],
  );

  // Avança de passo em passo conforme o usuário se aproxima de cada manobra, avisando em voz
  // alta com antecedência — igual ao "em 150 metros, vire à direita" de um GPS de verdade.
  useEffect(() => {
    if (!active || !passoAtual || distanciaProximoPasso === null) return;

    if (!passoPreAvisadoRef.current.has(passoIndex) && distanciaProximoPasso <= RAIO_PRE_AVISO_METROS) {
      passoPreAvisadoRef.current.add(passoIndex);
      falar(`Em ${formatDistanceFalada(distanciaProximoPasso)}, ${passoAtual.instrucao}.`);
    }

    if (distanciaProximoPasso <= RAIO_PASSO_CONCLUIDO_METROS && rota && passoIndex < rota.passos.length - 1) {
      setPassoIndex((i) => i + 1);
    }
  }, [active, passoAtual, passoIndex, distanciaProximoPasso, rota, falar]);

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
    destino,
    setDestino,
    distanciaDestino,
    rumoDestino,
    chegouDestino,
    rota,
    rotaCarregando,
    passoAtual,
    distanciaProximoPasso,
  };
}
