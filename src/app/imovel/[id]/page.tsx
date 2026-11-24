"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Scale,
  Share2,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Info,
  Clock,
} from "lucide-react";
import { Gallery } from "@/components/property/Gallery";
import { NearbyPOISection } from "@/components/property/NearbyPOISection";
import { CalculatorsSection } from "@/components/property/CalculatorsSection";
import { RouteButtons } from "@/components/property/RouteButtons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { getAllProperties } from "@/lib/data/properties";
import { formatBRL, formatCompactPrice, formatArea, formatDate, labelTipo } from "@/lib/format";
import { calcularRadar, RADAR_LABELS, RADAR_AVISO, isOportunidade } from "@/lib/radar";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Property } from "@/lib/types";
import clsx from "clsx";

const FEATURE_LABELS: Record<string, string> = {
  aceitaAnimais: "Aceita animais",
  condominioFechado: "Condomínio fechado",
  piscina: "Piscina",
  varanda: "Varanda",
  quintal: "Quintal",
  elevador: "Elevador",
  acessibilidade: "Acessibilidade",
  mobiliado: "Mobiliado",
};

export default function ImovelDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [all, setAll] = useState<Property[] | null>(null);
  const [routeOpen, setRouteOpen] = useState(false);

  const isFavorite = useAppStore((s) => s.isFavorite(id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const compareList = useAppStore((s) => s.compareList);
  const toggleCompare = useAppStore((s) => s.toggleCompare);

  useEffect(() => {
    getAllProperties().then(setAll);
  }, []);

  if (!all) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">Carregando…</div>;
  }

  const property = all.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold">Imóvel não encontrado.</p>
        <button onClick={() => router.push("/mapa")} className="text-sm font-semibold text-emerald">
          Voltar ao mapa
        </button>
      </div>
    );
  }

  const radar = calcularRadar(property, all);
  const oportunidade = isOportunidade(radar);
  const inCompare = compareList.includes(property.id);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: property.titulo,
      text: `${property.titulo} — ${formatCompactPrice(property.preco)} · Moraí${property.demo ? " (demonstrativo)" : ""}`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* usuário cancelou */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="relative">
        <Gallery fotos={property.fotos} titulo={property.titulo} />
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-safe flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="absolute right-3 top-safe flex gap-2">
          <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white">
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleFavorite(property.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
          >
            <Heart className={clsx("h-4 w-4", isFavorite && "fill-danger text-danger")} />
          </button>
        </div>
      </div>

      <div className="space-y-6 px-5 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {property.demo && (
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold">
              Imóvel demonstrativo — versão beta
            </span>
          )}
          {oportunidade && (
            <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-dark-green">
              {RADAR_LABELS[radar.classificacao]}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl font-extrabold leading-tight">{property.titulo}</h1>
          <p className="text-sm text-text-muted">{property.endereco}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-extrabold">
              {formatBRL(property.preco)}
              {property.finalidade === "aluguel" && <span className="text-sm font-medium"> /mês</span>}
            </p>
            <p className="text-xs text-text-muted">
              {formatBRL(property.precoM2)}/m² · {labelTipo(property.tipo)}
            </p>
          </div>
          <button
            onClick={() => toggleCompare(property.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold",
              inCompare ? "border-emerald text-emerald" : "border-border-subtle",
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            {inCompare ? "No comparador" : "Comparar"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-surface-muted p-3 text-center text-xs">
          <Stat icon={<Ruler className="h-4 w-4" />} value={formatArea(property.area)} label="Área" />
          <Stat icon={<BedDouble className="h-4 w-4" />} value={String(property.quartos)} label="Quartos" />
          <Stat icon={<Bath className="h-4 w-4" />} value={String(property.banheiros)} label="Banheiros" />
          <Stat icon={<Car className="h-4 w-4" />} value={String(property.vagas)} label="Vagas" />
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Sobre o imóvel</h2>
          <p className="text-sm leading-relaxed text-text-muted">{property.descricao}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Características</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(property.caracteristicas)
              .filter(([, v]) => v)
              .map(([k]) => (
                <span key={k} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs">
                  {FEATURE_LABELS[k] ?? k}
                </span>
              ))}
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-border-subtle p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald" />
            <h2 className="text-base font-bold">Moraí Radar</h2>
          </div>
          {radar.classificacao === "insuficiente" ? (
            <p className="text-sm text-text-muted">
              Amostra insuficiente de imóveis comparáveis no bairro para calcular uma referência confiável.
            </p>
          ) : (
            <>
              <p className="text-sm">
                Este imóvel está{" "}
                <strong>{RADAR_LABELS[radar.classificacao].toLowerCase()}</strong>
                {radar.diferencaPercentual !== null && (
                  <> ({radar.diferencaPercentual > 0 ? "+" : ""}{radar.diferencaPercentual}%)</>
                )}{" "}
                em relação a imóveis semelhantes no bairro.
              </p>
              <p className="text-xs text-text-muted">
                Mediana comparável: {formatBRL(radar.medianaM2)}/m² · {radar.amostraUtilizada} imóveis utilizados.
              </p>
            </>
          )}
          <p className="text-[11px] font-medium text-warning">{RADAR_AVISO}</p>
        </section>

        {property.historicoPrecos.length > 1 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-muted" />
              <h2 className="text-base font-bold">
                Histórico de preços{property.demo ? " (demonstrativo)" : ""}
              </h2>
            </div>
            <div className="space-y-1.5">
              {property.historicoPrecos.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{formatDate(h.date)}</span>
                  <span className="font-semibold">{formatBRL(h.price)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <NearbyPOISection lat={property.lat} lng={property.lng} />

        <CalculatorsSection property={property} />

        <section className="space-y-2">
          <h2 className="text-base font-bold">Como chegar</h2>
          <RouteButtons lat={property.lat} lng={property.lng} titulo={property.titulo} />
        </section>

        {property.demo ? (
          <p className="rounded-xl bg-surface-muted p-3 text-xs text-text-muted">
            Este anúncio faz parte da versão beta do Moraí e não possui proprietário ou corretor real —
            não é possível entrar em contato sobre ele. Em breve, imóveis cadastrados por usuários reais
            aparecerão aqui.
          </p>
        ) : property.contato ? (
          <p className="rounded-xl bg-surface-muted p-3 text-xs text-text-muted">
            Anúncio cadastrado por um usuário do Moraí. Contato informado pelo anunciante:{" "}
            <span className="font-semibold text-foreground">{property.contato}</span>
          </p>
        ) : (
          <p className="rounded-xl bg-surface-muted p-3 text-xs text-text-muted">
            Anúncio cadastrado por um usuário do Moraí. O anunciante não informou um contato.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border-subtle bg-surface p-4 pb-safe">
        <button
          onClick={() => toggleFavorite(property.id)}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold",
            isFavorite ? "border-danger text-danger" : "border-border-subtle",
          )}
        >
          <Heart className={clsx("h-4 w-4", isFavorite && "fill-danger")} />
          {isFavorite ? "Salvo" : "Salvar"}
        </button>
        <button
          onClick={() => setRouteOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald py-3 text-sm font-bold text-dark-green"
        >
          Como chegar
        </button>
      </div>

      <BottomSheet open={routeOpen} onClose={() => setRouteOpen(false)} maxHeightVh={45}>
        <div className="px-5 pb-6 pt-2">
          <h2 className="mb-3 text-lg font-bold">Como chegar</h2>
          <RouteButtons lat={property.lat} lng={property.lng} titulo={property.titulo} />
        </div>
      </BottomSheet>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-emerald">{icon}</span>
      <span className="font-bold">{value}</span>
      <span className="text-text-muted">{label}</span>
    </div>
  );
}
