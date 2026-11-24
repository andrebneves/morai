"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Locate, Layers, Navigation, Loader2 } from "lucide-react";
import { MapView, type MapViewHandle } from "@/components/map/MapView";
import { PurposeToggle } from "@/components/map/PurposeToggle";
import { SearchBar } from "@/components/map/SearchBar";
import { FiltersSheet } from "@/components/filters/FiltersSheet";
import { PropertyPreviewSheet } from "@/components/property/PropertyPreviewSheet";
import { ModoPasseioSheet } from "@/components/passeio/ModoPasseioSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { SplashScreen, useSplashGate } from "@/components/splash/SplashScreen";
import { Logo } from "@/components/icons/Logo";
import { useAppStore } from "@/lib/store/useAppStore";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useRadarMap } from "@/lib/hooks/useRadarMap";
import { useModoPasseio } from "@/lib/hooks/useModoPasseio";
import { getAllProperties } from "@/lib/data/properties";
import { applyFilters, countActiveFilters } from "@/lib/applyFilters";
import type { Property } from "@/lib/types";

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
  const passeio = useModoPasseio(properties);
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

  useEffect(() => {
    requestOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A ideia central do Moraí é o GPS de descoberta (Modo Passeio) — ele liga sozinho ao abrir
  // o mapa em vez de ficar escondido atrás de um botão, pra ser a experiência padrão.
  const passeioAutoIniciado = useRef(false);
  useEffect(() => {
    if (passeioAutoIniciado.current || loading) return;
    passeioAutoIniciado.current = true;
    passeio.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const filtered = applyFilters(properties, filters, radarById);
  const selected = properties.find((p) => p.id === selectedId) ?? null;
  const activeUserPosition = passeio.active ? passeio.position : position;

  const handleLocate = () => {
    requestOnce();
    if (position) mapRef.current?.flyTo(position.lat, position.lng, 16);
  };

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
        followHeading={passeio.active}
        onFollowPausedChange={setFollowPaused}
      />

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-safe">
        <div className="pointer-events-auto flex items-center justify-between">
          <Logo size={26} wordmarkClassName="text-lg drop-shadow-sm" />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald" />}
        </div>
        <div className="pointer-events-auto">
          <SearchBar
            onSelectResult={(r) => mapRef.current?.flyTo(r.lat, r.lng, r.zoom)}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilterCount={countActiveFilters(filters)}
          />
        </div>
        <div className="pointer-events-auto">
          <PurposeToggle value={filters.finalidade} onChange={(v) => setFilters({ finalidade: v })} />
        </div>
        {passeio.permission === "denied" && (
          <div className="pointer-events-auto rounded-xl bg-danger/90 px-4 py-2.5 text-xs font-medium text-off-white shadow-[var(--shadow-float)]">
            Localização não autorizada — ative o acesso à localização do Safari para o GPS do Moraí funcionar.
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="absolute right-4 top-[calc(var(--safe-top)+168px)] z-20 flex flex-col gap-2.5">
        <ControlButton icon={<Layers className="h-5 w-5" />} onClick={() => setSatellite((s) => !s)} active={satellite} />
        <ControlButton icon={<Locate className="h-5 w-5" />} onClick={handleLocate} />
      </div>

      {/* Recentralizar (modo GPS pausado por arraste manual) */}
      {passeio.active && followPaused && (
        <button
          onClick={() => mapRef.current?.resumeFollow()}
          className="absolute bottom-[calc(132px+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald px-4 py-2.5 text-sm font-bold text-dark-green shadow-[var(--shadow-float)] active:scale-95 transition-transform"
        >
          <Locate className="h-4 w-4" />
          Recentralizar
        </button>
      )}

      {/* Modo Passeio FAB */}
      <button
        onClick={() => setPasseioOpen(true)}
        className="absolute bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-dark-green px-5 py-3 text-sm font-bold text-off-white shadow-[var(--shadow-float)] active:scale-95 transition-transform"
      >
        <Navigation className={`h-4 w-4 ${passeio.active ? "text-lime animate-pulse" : "text-emerald"}`} />
        {passeio.active ? `Passeio ativo · ${passeio.nearby.length} próx.` : "Modo Passeio"}
      </button>

      <BottomSheet open={Boolean(selected)} onClose={() => setSelectedId(null)} maxHeightVh={55}>
        {selected && <PropertyPreviewSheet property={selected} radar={radarById[selected.id]} />}
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
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[var(--shadow-float)] active:scale-95 transition-transform ${
        active ? "bg-emerald text-dark-green" : "bg-surface text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}
