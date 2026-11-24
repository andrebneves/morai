"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { formatDistance } from "@/lib/geo";
import { formatCompactPrice } from "@/lib/format";
import { Footprints, Car, Volume2, VolumeX, Navigation } from "lucide-react";
import type { useModoPasseio, RaioPasseio } from "@/lib/hooks/useModoPasseio";

const RAIOS: { value: RaioPasseio; label: string }[] = [
  { value: 100, label: "100 m" },
  { value: 250, label: "250 m" },
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
];

interface ModoPasseioSheetProps {
  open: boolean;
  onClose: () => void;
  passeio: ReturnType<typeof useModoPasseio>;
}

export function ModoPasseioSheet({ open, onClose, passeio }: ModoPasseioSheetProps) {
  const {
    active,
    start,
    stop,
    raioMetros,
    setRaioMetros,
    modo,
    setModo,
    somAtivo,
    setSomAtivo,
    nearby,
    permission,
    testarAlerta,
  } = passeio;

  return (
    <BottomSheet open={open} onClose={onClose} maxHeightVh={80}>
      <div className="space-y-5 px-5 pb-6 pt-2">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-emerald" />
          <h2 className="text-lg font-bold">Modo Passeio</h2>
        </div>
        <p className="text-sm text-text-muted">
          Acompanhe sua localização enquanto explora Olinda e receba avisos quando houver
          imóveis demonstrativos próximos.
        </p>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Como você está se deslocando?</h3>
          <div className="flex gap-2">
            <Chip active={modo === "pe"} icon={<Footprints className="h-3.5 w-3.5" />} onClick={() => setModo("pe")}>
              A pé
            </Chip>
            <Chip active={modo === "carro"} icon={<Car className="h-3.5 w-3.5" />} onClick={() => setModo("carro")}>
              De carro
            </Chip>
          </div>
          {modo === "carro" && (
            <p className="text-xs text-warning">
              Não utilize o celular durante a condução. Peça para o passageiro acompanhar os alertas sonoros.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">Raio de descoberta</h3>
          <div className="flex flex-wrap gap-2">
            {RAIOS.map((r) => (
              <Chip key={r.value} active={raioMetros === r.value} onClick={() => setRaioMetros(r.value)}>
                {r.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
          <span className="text-sm font-medium">Alertas sonoros (voz em português)</span>
          <button onClick={() => setSomAtivo(!somAtivo)}>
            {somAtivo ? <Volume2 className="h-5 w-5 text-emerald" /> : <VolumeX className="h-5 w-5 text-text-muted" />}
          </button>
        </section>

        {active && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {nearby.length} imóvel(is) dentro do raio
            </h3>
            <div className="max-h-40 space-y-2 overflow-y-auto no-scrollbar">
              {nearby.slice(0, 6).map((n) => (
                <div
                  key={n.property.id}
                  className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2 text-sm"
                >
                  <span className="truncate pr-2">{n.property.titulo}</span>
                  <span className="shrink-0 text-xs font-semibold text-emerald">
                    {formatDistance(n.distanciaMetros)} · {formatCompactPrice(n.property.preco)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {permission === "denied" && (
          <p className="text-xs text-danger">
            Localização não autorizada. Habilite o acesso à localização do Safari para usar o Modo Passeio.
          </p>
        )}

        <p className="text-[11px] text-text-muted">
          O Moraí não funciona em segundo plano nem com a tela bloqueada no iPhone — mantenha o app
          aberto durante o passeio. Em breve: integração nativa com GPS.
        </p>

        <div className="flex gap-3">
          {!active ? (
            <Button fullWidth size="lg" onClick={start}>
              Iniciar Modo Passeio
            </Button>
          ) : (
            <Button fullWidth size="lg" variant="danger" onClick={stop}>
              Encerrar Modo Passeio
            </Button>
          )}
        </div>
        <button onClick={testarAlerta} className="w-full text-center text-sm font-semibold text-emerald">
          Testar alerta sonoro
        </button>
      </div>
    </BottomSheet>
  );
}
