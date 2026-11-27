"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Compass, Eye, Home, Key, Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useCompassHeading } from "@/lib/hooks/useCompassHeading";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import { getAllProperties } from "@/lib/data/properties";
import { bearingDegrees, haversineMeters, formatDistance } from "@/lib/geo";
import { formatCompactPrice } from "@/lib/format";
import type { Property } from "@/lib/types";

// Campo de visão horizontal aproximado da câmera traseira de um celular — usado só pra decidir
// em que posição horizontal da tela cada imóvel "deveria" aparecer, dado o rumo até ele e pra
// onde o aparelho está apontando. Não é uma medida real da lente de cada aparelho.
const CAMPO_DE_VISAO_GRAUS = 65;

const RAIOS = [150, 300, 600] as const;

// Mesma curva --ease-standard do design system (globals.css) — ease-out forte, sem o arrasto
// do ease padrão do navegador.
const EASE = [0.22, 1, 0.36, 1] as const;
const EASE_CSS = "var(--ease-standard)";

interface ImovelNaMira {
  property: Property;
  distanciaMetros: number;
  rumoRelativo: number;
}

export default function VisionPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [raioMetros, setRaioMetros] = useState<(typeof RAIOS)[number]>(300);
  const [fase, setFase] = useState<"intro" | "ativo" | "erro-camera">("intro");

  const { position, permission: geoPermission, requestOnce } = useGeolocation({ watch: true });
  const { heading, permission: compassPermission, requestPermission: ativarBussola } = useCompassHeading();
  const radarById = useRadarMap(properties);

  useEffect(() => {
    getAllProperties().then(setProperties);
  }, []);

  const ativar = async () => {
    requestOnce();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setFase("ativo");
    } catch {
      setFase("erro-camera");
      return;
    }
    await ativarBussola();
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const semBussola = compassPermission === "unsupported" || compassPermission === "denied";

  const naMira: ImovelNaMira[] = useMemo(() => {
    if (!position) return [];
    return properties
      .map((property) => {
        const distanciaMetros = haversineMeters(position, { lat: property.lat, lng: property.lng });
        const rumo = bearingDegrees(position, { lat: property.lat, lng: property.lng });
        const rumoRelativo = ((rumo - (heading ?? 0) + 540) % 360) - 180;
        return { property, distanciaMetros, rumoRelativo };
      })
      .filter((n) => n.distanciaMetros <= raioMetros)
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  }, [position, properties, heading, raioMetros]);

  const naTela = semBussola ? [] : naMira.filter((n) => Math.abs(n.rumoRelativo) <= CAMPO_DE_VISAO_GRAUS / 2);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-graphite text-off-white">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {/* Topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-safe">
        <button
          onClick={() => router.push("/mapa")}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:scale-90 transition-transform"
          aria-label="Voltar ao mapa"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-lime" />
          Moraí Vision
        </div>
        <div className="w-10" />
      </div>

      <AnimatePresence mode="wait">
        {fase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-graphite/90 px-8 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald/15">
              <Eye className="h-8 w-8 text-lime" />
            </div>
            <h1 className="text-xl font-bold">Veja os imóveis ao seu redor</h1>
            <p className="text-sm text-off-white/70">
              Aponte a câmera pra rua e o Moraí mostra, na direção certa, os imóveis à venda ou pra
              alugar por perto — usando sua localização e a bússola do aparelho.
            </p>
            <p className="rounded-xl bg-white/5 px-4 py-3 text-xs text-off-white/60">
              Isso aponta a direção e a distância aproximadas — ainda não reconhece visualmente qual
              prédio é qual.
            </p>
            <button
              onClick={ativar}
              className="mt-2 flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-bold text-dark-green transition-transform active:scale-95"
              style={{ transitionTimingFunction: EASE_CSS }}
            >
              <Camera className="h-4 w-4" />
              Ativar câmera e bússola
            </button>
          </motion.div>
        )}

        {fase === "erro-camera" && (
          <motion.div
            key="erro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-graphite px-8 text-center"
          >
            <Camera className="h-10 w-10 text-off-white/40" />
            <p className="text-sm text-off-white/70">
              Não consegui acessar a câmera. Confira se você autorizou o acesso à câmera do Safari
              para o Moraí e tente de novo.
            </p>
            <button
              onClick={ativar}
              className="rounded-full bg-emerald px-5 py-2.5 text-sm font-bold text-dark-green transition-transform active:scale-95"
              style={{ transitionTimingFunction: EASE_CSS }}
            >
              Tentar de novo
            </button>
          </motion.div>
        )}

        {fase === "ativo" && (
          <motion.div key="ativo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: EASE }}>
            {/* Overlays de imóveis posicionados por rumo relativo */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <AnimatePresence>
                {naTela.map((n) => {
                  const t = Math.min(1, n.distanciaMetros / raioMetros);
                  const leftPercent = 50 + (n.rumoRelativo / (CAMPO_DE_VISAO_GRAUS / 2)) * 50;
                  const topPercent = 70 - t * 30;
                  const escala = 1 - t * 0.3;
                  const radar = radarById[n.property.id];
                  const oportunidade = radar?.classificacao === "abaixo" || radar?.classificacao === "muito_abaixo";
                  return (
                    <motion.button
                      key={n.property.id}
                      onClick={() => router.push(`/imovel/${n.property.id}`)}
                      className="pointer-events-auto absolute flex flex-col items-center gap-1"
                      style={{ left: `${leftPercent}%`, top: `${topPercent}%`, x: "-50%" }}
                      initial={{ opacity: 0, scale: escala * 0.9 }}
                      animate={{ opacity: 1, scale: escala }}
                      exit={{ opacity: 0, scale: escala * 0.9 }}
                      whileTap={{ scale: escala * 0.92 }}
                      transition={{ duration: 0.22, ease: EASE }}
                    >
                      {oportunidade && (
                        <span className="rounded-full bg-lime px-2 py-0.5 text-[9px] font-bold text-dark-green shadow-[var(--shadow-float)]">
                          Oportunidade
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-[var(--shadow-float)] ${
                          oportunidade ? "bg-lime text-dark-green" : "bg-dark-green/90 text-off-white backdrop-blur-sm"
                        }`}
                      >
                        {n.property.finalidade === "venda" ? <Home className="h-3.5 w-3.5" /> : <Key className="h-3.5 w-3.5" />}
                        {formatCompactPrice(n.property.preco)}
                      </span>
                      <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-off-white/80">
                        {formatDistance(n.distanciaMetros)}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Fallback sem bússola: lista por distância */}
            {semBussola && (
              <div className="pointer-events-auto absolute inset-x-4 top-[calc(var(--safe-top)+64px)] z-20 max-h-[45vh] space-y-2 overflow-y-auto no-scrollbar">
                <p className="rounded-xl bg-black/50 px-3 py-2 text-xs text-off-white/80">
                  Bússola não disponível neste aparelho — mostrando os imóveis mais próximos em
                  lista, sem direção na tela.
                </p>
                {naMira.slice(0, 8).map((n) => (
                  <button
                    key={n.property.id}
                    onClick={() => router.push(`/imovel/${n.property.id}`)}
                    className="flex w-full items-center justify-between rounded-xl bg-black/50 px-3 py-2.5 text-left text-sm transition-transform active:scale-[0.98]"
                    style={{ transitionTimingFunction: EASE_CSS }}
                  >
                    <span className="truncate pr-2">{n.property.titulo}</span>
                    <span className="shrink-0 text-xs font-bold text-lime">
                      {formatCompactPrice(n.property.preco)} · {formatDistance(n.distanciaMetros)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {naTela.length === 0 && !semBussola && (
              <div className="pointer-events-none absolute inset-x-8 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-black/50 px-4 py-3 text-center text-sm text-off-white/80">
                Nenhum imóvel nessa direção, dentro de {formatDistance(raioMetros)}. Gire o celular ou
                aumente o raio.
              </div>
            )}

            {geoPermission === "denied" && (
              <div className="pointer-events-none absolute inset-x-8 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-danger/80 px-4 py-3 text-center text-xs text-off-white">
                Localização não autorizada — ative o acesso à localização do Safari pro Moraí Vision
                funcionar.
              </div>
            )}

            {/* Controles inferiores: raio + aviso de precisão */}
            <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              <div className="flex gap-2">
                {RAIOS.map((r) => (
                  <Chip key={r} active={raioMetros === r} onClick={() => setRaioMetros(r)}>
                    {formatDistance(r)}
                  </Chip>
                ))}
              </div>
              <p className="flex max-w-[88%] items-center justify-center gap-1.5 text-center rounded-full bg-black/50 px-3 py-1.5 text-[10px] text-off-white/70">
                <Compass className="h-3 w-3 shrink-0" />
                Direção e distância aproximadas — não reconhece o prédio pela câmera
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
