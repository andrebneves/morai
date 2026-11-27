"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Chip } from "@/components/ui/Chip";
import { PerfilEditor } from "@/components/passeio/PerfilEditor";
import { formatDistance } from "@/lib/geo";
import { formatCompactPrice } from "@/lib/format";
import { Footprints, Car, Volume2, VolumeX, Radar, Plus, Pencil, Pause, Play, Copy, Trash2 } from "lucide-react";
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
    raioMetros,
    setRaioMetros,
    modo,
    setModo,
    somAtivo,
    setSomAtivo,
    nearby,
    permission,
    testarAlerta,
    perfis,
    perfilAtivo,
    criarPerfil,
    atualizarPerfil,
    duplicarPerfil,
    removerPerfil,
    pausarPerfil,
    definirPerfilAtivo,
  } = passeio;
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const handleCriarPerfil = () => {
    const nome = window.prompt("Nome do novo perfil (ex: Casa pra comprar na zona sul)");
    if (!nome || !nome.trim()) return;
    const id = criarPerfil(nome.trim());
    setEditandoId(id);
  };

  return (
    <BottomSheet open={open} onClose={onClose} maxHeightVh={80}>
      <div className="space-y-5 px-5 pb-6 pt-2">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-emerald" />
          <h2 className="text-lg font-bold">Descoberta por perto</h2>
        </div>
        <p className="text-sm text-text-muted">
          O Moraí acompanha sua localização o tempo todo enquanto o mapa está aberto e avisa
          quando houver imóveis próximos — ajuste aqui como isso funciona.
        </p>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-muted">Perfis de busca salvos</h3>
            <button onClick={handleCriarPerfil} className="flex items-center gap-1 text-xs font-bold text-emerald">
              <Plus className="h-3.5 w-3.5" />
              Novo perfil
            </button>
          </div>

          {perfis.length === 0 ? (
            <p className="text-xs text-text-muted">
              Crie um perfil pra separar o que é obrigatório do que é só desejável nos seus
              alertas — e salvar vários perfis pra alternar sem perder a configuração.
            </p>
          ) : (
            <div className="space-y-2">
              {perfis.map((perfil) => {
                const ativo = perfilAtivo?.id === perfil.id;
                return (
                  <div
                    key={perfil.id}
                    className={`rounded-xl border px-3 py-2.5 ${
                      ativo ? "border-emerald bg-emerald/10" : "border-border-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => definirPerfilAtivo(ativo ? null : perfil.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="truncate text-sm font-semibold">{perfil.nome}</span>
                        {ativo && <span className="ml-2 text-[11px] font-bold text-emerald">Em uso</span>}
                        {perfil.pausado && !ativo && (
                          <span className="ml-2 text-[11px] text-text-muted">Pausado</span>
                        )}
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          label="Editar critérios do perfil"
                          onClick={() => setEditandoId(editandoId === perfil.id ? null : perfil.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={perfil.pausado ? "Reativar perfil" : "Pausar perfil"}
                          onClick={() => pausarPerfil(perfil.id, !perfil.pausado)}
                        >
                          {perfil.pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </IconButton>
                        <IconButton label="Duplicar perfil" onClick={() => duplicarPerfil(perfil.id)}>
                          <Copy className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Excluir perfil"
                          onClick={() => {
                            if (window.confirm(`Excluir o perfil "${perfil.nome}"?`)) removerPerfil(perfil.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </IconButton>
                      </div>
                    </div>
                    {editandoId === perfil.id && (
                      <PerfilEditor perfil={perfil} onChange={(patch) => atualizarPerfil(perfil.id, patch)} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

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

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted">
            {nearby.length} imóvel(is) dentro do raio
            {perfilAtivo && <span className="font-normal"> · perfil &ldquo;{perfilAtivo.nome}&rdquo;</span>}
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
                  {n.compatibilidade !== null && ` · ${n.compatibilidade}%`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {permission === "denied" && (
          <p className="text-xs text-danger">
            Localização não autorizada. Habilite o acesso à localização do Safari para o Moraí funcionar.
          </p>
        )}

        <p className="text-[11px] text-text-muted">
          O Moraí não funciona em segundo plano nem com a tela bloqueada no iPhone — mantenha o app
          aberto enquanto explora. Em breve: integração nativa com GPS.
        </p>

        <button onClick={testarAlerta} className="w-full text-center text-sm font-semibold text-emerald">
          Testar alerta sonoro
        </button>
      </div>
    </BottomSheet>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-transform active:scale-90"
    >
      {children}
    </button>
  );
}
