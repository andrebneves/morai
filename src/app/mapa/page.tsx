"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Locate, Layers, Navigation, X, CheckCircle2, CornerUpRight, CornerUpLeft, ArrowUp, Eye, SlidersHorizontal } from "lucide-react";
import { MapView, type MapViewHandle } from "@/components/map/MapView";
import { MoraiHeader } from "@/components/layout/MoraiHeader";
import { PurposeToggle } from "@/components/map/PurposeToggle";
import { SearchBar } from "@/components/map/SearchBar";
import { QuickFilterChips } from "@/components/map/QuickFilterChips";
import { FiltersSheet } from "@/components/filters/FiltersSheet";
import { PropertyPreviewSheet } from "@/components/property/PropertyPreviewSheet";
import { ModoPasseioSheet } from "@/components/passeio/ModoPasseioSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { SplashScreen, useSplashGate } from "@/components/splash/SplashScreen";
import { useAppStore } from "@/lib/store/useAppStore";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import { useModoPasseio } from "@/lib/hooks/useModoPasseio";
import { getAllProperties } from "@/lib/data/properties";
import { applyFilters, countActiveFilters } from "@/lib/applyFilters";
import { formatDistance } from "@/lib/geo";
import type { Property } from "@/lib/types";

/** Ícone da manobra atual da rota (ou uma seta genérica quando ainda não há rota calculada). */
function iconeManobra(tipo: string, modificador: string | null) {
  if (tipo === "arrive") return CheckCircle2;
  if (modificador?.includes("right")) return CornerUpRight;
  if (modificador?.includes("left")) return CornerUpLeft;
  return ArrowUp;
}

export default function MapaPage() {
  const router = useRouter();
  const onboarded = useAppStore((s) => s.onboarded);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [passeioOpen, setPasseioOpen] = useState(false);
  const [followPaused, setFollowPaused] = useState(false);

  const mapRef = useRef<MapViewHandle>(null);
  const { position, requestOnce } = useGeolocation();
  const radarById = useRadarMap(properties);
  const passeio = useModoPasseio(properties, radarById);
  const { show: showSplash, fading: splashFading } = useSplashGate(!loading);

  useEffect(() => {
    if (!onboarded) {
      router.replace("/");
    }
  }, [onboarded, router]);

  useEffect(() => {
    getAllProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  // Vindo do detalhe do imóvel (botão "Ir até lá") via /mapa?ir=<id> — ativa o GPS próprio do
  // Moraí direto no destino, sem passar por Apple Maps/Google Maps/Waze (pedido explícito: "nós
  // somos a plataforma que vai fazer ele chegar nesse local"). Só uma vez, pra não reativar o
  // destino se o usuário cancelar e a URL ainda não tiver sido limpa.
  const irProcessadoRef = useRef(false);
  useEffect(() => {
    if (irProcessadoRef.current || properties.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("ir");
    if (!id) return;
    irProcessadoRef.current = true;
    const property = properties.find((p) => p.id === id);
    if (property) passeio.setDestino(property);
    window.history.replaceState(null, "", "/mapa");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  useEffect(() => {
    requestOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = applyFilters(properties, filters, radarById);
  const selected = properties.find((p) => p.id === selectedId) ?? null;
  // O Moraí não é um app com um "Modo Passeio" opcional — o app É esse modo: a localização
  // acompanha sempre que o mapa está aberto, sem precisar ligar nada.
  const activeUserPosition = passeio.position ?? position;

  const handleLocate = () => {
    requestOnce();
    if (position) mapRef.current?.flyTo(position.lat, position.lng, 16);
  };

  // "Dirigir até lá" é o próprio GPS do Moraí guiando por distância/rumo em linha reta — não
  // abre um app de navegação externo (pedido explícito: "a navegação deveria ser dele próprio").
  const handleDirigir = (property: Property) => {
    passeio.setDestino(property);
    setSelectedId(null);
  };

  const rumoRelativo =
    passeio.rumoDestino !== null ? (passeio.rumoDestino - (activeUserPosition?.heading ?? 0) + 360) % 360 : null;

  // Texto real do status (nunca uma legenda fictícia de "modo ativado") — reflete o estado de
  // verdade da localização/descoberta nesse instante.
  const statusLabel =
    passeio.permission === "denied"
      ? "Localização indisponível"
      : !activeUserPosition
        ? "Localizando você…"
        : `${passeio.nearby.length} imóvel(is) por perto`;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {showSplash && <SplashScreen fadingOut={splashFading} />}
      <MapView
        ref={mapRef}
        properties={filtered}
        radarById={radarById}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
        userPosition={activeUserPosition}
        satellite={satellite}
        followHeading={Boolean(activeUserPosition)}
        onFollowPausedChange={setFollowPaused}
        routeCoordinates={passeio.rota?.coordenadas ?? null}
      />

      {/* Top overlay */}
      <div className="absolute inset-x-0 top-0 z-20">
        <MoraiHeader
          loading={loading}
          badge={
            passeio.destino && (
              <span className="flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-dark-green">
                <Navigation className="h-3 w-3" />
                Rota ativa
              </span>
            )
          }
        >
          <SearchBar
            onSelectResult={(r) => mapRef.current?.flyTo(r.lat, r.lng, r.zoom)}
            purpose={filters.finalidade}
          />
          <QuickFilterChips filters={filters} onChange={setFilters} />
        </MoraiHeader>
        <div className="pointer-events-none mt-3 flex flex-col gap-3 px-4">
        <div className="pointer-events-auto">
          <PurposeToggle value={filters.finalidade} onChange={(v) => setFilters({ finalidade: v })} />
        </div>
        <AnimatePresence>
          {passeio.permission === "denied" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-auto rounded-xl bg-danger/90 px-4 py-2.5 text-xs font-medium text-off-white shadow-[var(--shadow-float)]"
            >
              Localização não autorizada — ative o acesso à localização do Safari para o GPS do Moraí funcionar.
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {passeio.destino && (() => {
            const IconeManobra = passeio.passoAtual ? iconeManobra(passeio.passoAtual.tipo, passeio.passoAtual.modificador) : null;
            const linhaTitulo = passeio.chegouDestino
              ? "Você chegou perto do imóvel"
              : (passeio.passoAtual?.instrucao ?? passeio.destino.titulo);
            const linhaSub = passeio.chegouDestino
              ? passeio.destino.titulo
              : passeio.passoAtual && passeio.distanciaProximoPasso !== null
                ? `${formatDistance(passeio.distanciaProximoPasso)} · ${passeio.destino.titulo}`
                : passeio.rotaCarregando
                  ? "Calculando rota pelas ruas…"
                  : passeio.distanciaDestino !== null
                    ? `${formatDistance(passeio.distanciaDestino)} · siga a seta`
                    : passeio.destino.titulo;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="pointer-events-auto relative z-30 flex items-center gap-2.5 rounded-xl bg-dark-green py-2.5 pl-3.5 pr-14 text-off-white shadow-[var(--shadow-float)]"
              >
                {passeio.chegouDestino ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-lime" />
                ) : IconeManobra ? (
                  <IconeManobra className="h-5 w-5 shrink-0 text-lime" />
                ) : (
                  <Navigation
                    className="h-5 w-5 shrink-0 text-lime transition-transform"
                    style={rumoRelativo !== null ? { transform: `rotate(${rumoRelativo}deg)` } : undefined}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={linhaTitulo}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="truncate text-xs font-bold"
                    >
                      {linhaTitulo}
                    </motion.p>
                  </AnimatePresence>
                  <p className="truncate text-[11px] text-off-white/65">{linhaSub}</p>
                </div>
                <button onClick={() => passeio.setDestino(null)} aria-label="Cancelar destino" className="shrink-0 p-1 transition-transform active:scale-90">
                  <X className="h-4 w-4 text-off-white/60" />
                </button>
              </motion.div>
            );
          })()}
        </AnimatePresence>
        </div>
      </div>

      {/* Right controls — ordem e visual pedidos no briefing: botões circulares flutuantes,
          fundo claro, ícone verde-escuro, na lateral direita (camadas, centralizar, filtros). */}
      <div className="absolute right-4 top-[calc(var(--safe-top)+168px)] z-20 flex flex-col gap-2.5">
        <ControlButton
          icon={<Layers className="h-5 w-5" />}
          onClick={() => setSatellite((s) => !s)}
          active={satellite}
          label="Camadas do mapa"
        />
        <ControlButton icon={<Locate className="h-5 w-5" />} onClick={handleLocate} label="Centralizar localização" />
        <ControlButton
          icon={<SlidersHorizontal className="h-5 w-5" />}
          onClick={() => setFiltersOpen(true)}
          badge={countActiveFilters(filters) || undefined}
          label="Filtros"
        />
        <ControlButton icon={<Eye className="h-5 w-5" />} onClick={() => router.push("/vision")} label="Moraí Vision" />
      </div>

      {/* Recentralizar (modo GPS pausado por arraste manual) */}
      <AnimatePresence>
        {followPaused && (
          <motion.button
            onClick={() => mapRef.current?.resumeFollow()}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bottom-[calc(132px+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald px-4 py-2.5 text-sm font-bold text-dark-green shadow-[var(--shadow-float)]"
          >
            <Locate className="h-4 w-4" />
            Recentralizar
          </motion.button>
        )}
      </AnimatePresence>

      {/* Status de descoberta por perto (sempre ativo — abre os ajustes de raio/som/deslocamento) */}
      <button
        onClick={() => setPasseioOpen(true)}
        className="absolute bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-dark-green px-5 py-3 text-sm font-bold text-off-white shadow-[var(--shadow-float)] active:scale-95 transition-transform"
      >
        <Navigation className="h-4 w-4 text-lime animate-pulse" />
        {statusLabel}
      </button>

      <BottomSheet open={Boolean(selected)} onClose={() => setSelectedId(null)} maxHeightVh={55}>
        {selected && (
          <PropertyPreviewSheet property={selected} radar={radarById[selected.id]} onDirigir={handleDirigir} />
        )}
      </BottomSheet>

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} resultCount={filtered.length} />

      <ModoPasseioSheet open={passeioOpen} onClose={() => setPasseioOpen(false)} passeio={passeio} />

      <BottomNav />
    </div>
  );
}

function ControlButton({
  icon,
  onClick,
  active,
  badge,
  label,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  /** Contador exibido num selo lima no canto, ex. número de filtros ativos. */
  badge?: number;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full shadow-[var(--shadow-float)] active:scale-95 transition-transform ${
        active ? "bg-emerald text-dark-green" : "bg-surface text-foreground"
      }`}
    >
      {icon}
      {!!badge && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-[9px] font-bold text-dark-green ring-2 ring-surface">
          {badge}
        </span>
      )}
    </button>
  );
}
