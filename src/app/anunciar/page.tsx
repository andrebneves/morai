"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MapView } from "@/components/map/MapView";
import { OLINDA_BAIRROS, OLINDA_CENTER } from "@/lib/data/olinda-bairros";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { saveLocalSubmission } from "@/lib/data/properties";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingPurpose, Property, PropertyType } from "@/lib/types";

const TIPOS: { value: PropertyType; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "casa_condominio", label: "Casa em condomínio" },
  { value: "cobertura", label: "Cobertura" },
  { value: "kitnet", label: "Kitnet" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
];

const CARACTERISTICAS: { key: string; label: string }[] = [
  { key: "aceitaAnimais", label: "Aceita animais" },
  { key: "condominioFechado", label: "Condomínio fechado" },
  { key: "piscina", label: "Piscina" },
  { key: "varanda", label: "Varanda" },
  { key: "quintal", label: "Quintal" },
  { key: "elevador", label: "Elevador" },
  { key: "acessibilidade", label: "Acessibilidade" },
  { key: "mobiliado", label: "Mobiliado" },
];

export default function AnunciarPage() {
  const router = useRouter();
  const { position, requestOnce } = useGeolocation();

  const [finalidade, setFinalidade] = useState<ListingPurpose>("venda");
  const [tipo, setTipo] = useState<PropertyType>("casa");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [area, setArea] = useState("");
  const [quartos, setQuartos] = useState("2");
  const [banheiros, setBanheiros] = useState("1");
  const [vagas, setVagas] = useState("1");
  const [condominio, setCondominio] = useState("0");
  const [iptu, setIptu] = useState("0");
  const [bairro, setBairro] = useState(OLINDA_BAIRROS[0].nome);
  const [endereco, setEndereco] = useState("");
  const [contato, setContato] = useState("");
  const [fotosInput, setFotosInput] = useState("");
  const [caracteristicas, setCaracteristicas] = useState<Record<string, boolean>>({});
  const [localizacaoExata, setLocalizacaoExata] = useState(true);
  const [pin, setPin] = useState<{ lat: number; lng: number }>(OLINDA_CENTER);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const usarMinhaLocalizacao = () => {
    requestOnce();
  };

  if (position && (pin.lat === OLINDA_CENTER.lat && pin.lng === OLINDA_CENTER.lng)) {
    setPin({ lat: position.lat, lng: position.lng });
  }

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng });
  }, []);

  const handleSubmit = async () => {
    if (!titulo || !preco || !area) {
      alert("Preencha ao menos título, preço e área.");
      return;
    }
    setSubmitting(true);

    const fotos = fotosInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const property: Property = {
      id: `user-${Date.now()}`,
      demo: false,
      titulo,
      descricao: descricao || "Sem descrição informada pelo anunciante.",
      finalidade,
      tipo,
      preco: Number(preco),
      condominio: Number(condominio) || 0,
      iptuMensal: Number(iptu) || 0,
      area: Number(area),
      precoM2: Math.round((Number(preco) / Number(area)) * 100) / 100,
      quartos: Number(quartos) || 0,
      suites: 0,
      banheiros: Number(banheiros) || 0,
      vagas: Number(vagas) || 0,
      bairro,
      endereco: endereco || `${bairro}, Olinda - PE`,
      lat: pin.lat,
      lng: pin.lng,
      contato: contato || undefined,
      fotos: fotos.length > 0 ? fotos : [`https://picsum.photos/seed/user-${Date.now()}/960/720`],
      caracteristicas: {
        aceitaAnimais: Boolean(caracteristicas.aceitaAnimais),
        condominioFechado: Boolean(caracteristicas.condominioFechado),
        piscina: Boolean(caracteristicas.piscina),
        varanda: Boolean(caracteristicas.varanda),
        quintal: Boolean(caracteristicas.quintal),
        elevador: Boolean(caracteristicas.elevador),
        acessibilidade: Boolean(caracteristicas.acessibilidade),
        mobiliado: Boolean(caracteristicas.mobiliado),
      },
      dataPublicacao: new Date().toISOString().slice(0, 10),
      historicoPrecos: [{ date: new Date().toISOString().slice(0, 10), price: Number(preco) }],
      status: "disponivel",
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("properties").insert({
          titulo: property.titulo,
          descricao: property.descricao,
          finalidade: property.finalidade,
          tipo: property.tipo,
          preco: property.preco,
          condominio: property.condominio,
          iptu_mensal: property.iptuMensal,
          area: property.area,
          preco_m2: property.precoM2,
          quartos: property.quartos,
          suites: property.suites,
          banheiros: property.banheiros,
          vagas: property.vagas,
          bairro: property.bairro,
          endereco: property.endereco,
          lat: property.lat,
          lng: property.lng,
          contato: property.contato,
          fotos: property.fotos,
          caracteristicas: property.caracteristicas,
          demo: false,
          data_publicacao: property.dataPublicacao,
          historico_precos: property.historicoPrecos,
          status: "pendente", // aguarda moderação antes de aparecer para outros usuários
          localizacao_exata: localizacaoExata,
        });
      }
    }

    // Sempre salvamos também localmente, para funcionar mesmo sem Supabase configurado
    saveLocalSubmission(property);

    setSubmitting(false);
    setDone(true);
    setTimeout(() => router.push("/mapa"), 1800);
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald" />
        <h1 className="text-lg font-bold">Imóvel cadastrado!</h1>
        <p className="text-sm text-text-muted">
          {isSupabaseConfigured()
            ? "Seu anúncio foi enviado para moderação e, assim que aprovado, aparecerá para todos os usuários do Moraí."
            : "Seu anúncio já aparece no mapa deste dispositivo. Para compartilhar com outros usuários, configure o Supabase (ver DATABASE.md)."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="space-y-6 px-5 pt-safe">
        <h1 className="text-xl font-extrabold">Anunciar imóvel</h1>
        <p className="text-sm text-text-muted">
          Cadastre um imóvel real para venda ou aluguel. Campos marcados com * são obrigatórios.
        </p>

        <section className="space-y-2">
          <Label>Finalidade</Label>
          <div className="flex gap-2">
            <Chip active={finalidade === "venda"} onClick={() => setFinalidade("venda")}>Venda</Chip>
            <Chip active={finalidade === "aluguel"} onClick={() => setFinalidade("aluguel")}>Aluguel</Chip>
          </div>
        </section>

        <section className="space-y-2">
          <Label>Tipo de imóvel</Label>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <Chip key={t.value} active={tipo === t.value} onClick={() => setTipo(t.value)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </section>

        <Field label="Título *">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" placeholder="Ex: Casa reformada em Casa Caiada" />
        </Field>

        <Field label="Descrição">
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none min-h-24" placeholder="Conte mais sobre o imóvel" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={finalidade === "venda" ? "Preço (R$) *" : "Aluguel mensal (R$) *"}>
            <input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="Área (m²) *">
            <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="Quartos">
            <input type="number" value={quartos} onChange={(e) => setQuartos(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="Banheiros">
            <input type="number" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="Vagas">
            <input type="number" value={vagas} onChange={(e) => setVagas(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="Condomínio (R$)">
            <input type="number" value={condominio} onChange={(e) => setCondominio(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
          <Field label="IPTU mensal (R$)">
            <input type="number" value={iptu} onChange={(e) => setIptu(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" />
          </Field>
        </div>

        <section className="space-y-2">
          <Label>Características</Label>
          <div className="flex flex-wrap gap-2">
            {CARACTERISTICAS.map((c) => (
              <Chip
                key={c.key}
                active={Boolean(caracteristicas[c.key])}
                onClick={() => setCaracteristicas((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </section>

        <Field label="Fotos (URLs separadas por vírgula)">
          <input value={fotosInput} onChange={(e) => setFotosInput(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" placeholder="https://..., https://..." />
        </Field>
        <p className="-mt-4 text-xs text-text-muted">
          Upload direto de arquivos estará disponível quando o Supabase Storage for configurado. Por ora, use links de imagens já hospedadas.
        </p>

        <section className="space-y-2">
          <Label>Bairro</Label>
          <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none">
            {OLINDA_BAIRROS.map((b) => (
              <option key={b.nome} value={b.nome}>{b.nome}</option>
            ))}
          </select>
        </section>

        <Field label="Endereço">
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" placeholder="Rua, número — bairro" />
        </Field>

        <Field label="Contato (telefone/WhatsApp)">
          <input value={contato} onChange={(e) => setContato(e.target.value)} className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none" placeholder="(81) 90000-0000" />
        </Field>

        <section className="space-y-2">
          <Label>Localização no mapa</Label>
          <div className="flex gap-2">
            <Chip active={localizacaoExata} onClick={() => setLocalizacaoExata(true)}>Exata</Chip>
            <Chip active={!localizacaoExata} onClick={() => setLocalizacaoExata(false)}>Aproximada</Chip>
          </div>
          <button onClick={usarMinhaLocalizacao} className="flex items-center gap-1.5 text-xs font-semibold text-emerald">
            <MapPin className="h-3.5 w-3.5" /> Usar minha localização atual
          </button>
          <p className="text-xs text-text-muted">Toque no mapa para ajustar o pino manualmente.</p>
          <div className="h-56 overflow-hidden rounded-2xl border border-border-subtle">
            <MapView
              properties={[]}
              onSelectProperty={() => {}}
              onMapClick={handleMapClick}
              userPosition={pin}
              initialCenter={pin}
              initialZoom={15}
            />
          </div>
        </section>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar imóvel"}
        </Button>
      </div>


      <BottomNav />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-text-muted">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </section>
  );
}
