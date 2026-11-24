"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

interface PendingRow {
  id: string;
  titulo: string;
  bairro: string;
  preco: number;
  finalidade: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [localSubmissions, setLocalSubmissions] = useState<unknown[]>([]);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    supabase?.auth.getSession().then(({ data }: { data: { session: Session | null } }) => setSession(data.session));
    const { data: sub } =
      supabase?.auth.onAuthStateChange((_e: AuthChangeEvent, s: Session | null) => setSession(s)) ?? { data: null };
    return () => sub?.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("morai:local-submissions:v1") : null;
    setLocalSubmissions(raw ? JSON.parse(raw) : []);
  }, []);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseBrowserClient();
    supabase
      ?.from("properties")
      .select("id,titulo,bairro,preco,finalidade,status")
      .eq("status", "pendente")
      .then(({ data }: { data: PendingRow[] | null }) => setPending(data ?? []));
  }, [session]);

  const handleLogin = async () => {
    setAuthError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = (await supabase?.auth.signInWithPassword({ email, password })) ?? {};
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
  };

  const approve = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.from("properties").update({ status: "disponivel" }).eq("id", id);
    setPending((p) => p.filter((row) => row.id !== id));
  };

  const reject = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.from("properties").update({ status: "indisponivel" }).eq("id", id);
    setPending((p) => p.filter((row) => row.id !== id));
  };

  const clearLocalSubmissions = () => {
    window.localStorage.removeItem("morai:local-submissions:v1");
    setLocalSubmissions([]);
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-16 pt-safe">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Painel administrativo</h1>
        </div>
        {session && (
          <button onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {!configured && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            O Supabase ainda não está configurado neste ambiente, então não há autenticação segura nem
            banco compartilhado disponível. Abaixo estão os imóveis cadastrados apenas neste dispositivo
            (modo demonstrativo local).
          </p>
          <div className="space-y-2">
            {localSubmissions.length === 0 && <p className="text-sm text-text-muted">Nenhum cadastro local.</p>}
            {localSubmissions.map((p, i) => {
              const prop = p as { id: string; titulo: string; bairro: string; preco: number };
              return (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2.5 text-sm">
                  <span>{prop.titulo} · {prop.bairro}</span>
                  <span className="font-semibold">{formatBRL(prop.preco)}</span>
                </div>
              );
            })}
          </div>
          {localSubmissions.length > 0 && (
            <button onClick={clearLocalSubmissions} className="flex items-center gap-1.5 text-xs font-semibold text-danger">
              <Trash2 className="h-3.5 w-3.5" /> Remover todos os cadastros locais
            </button>
          )}
        </div>
      )}

      {configured && !session && (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">Entre com sua conta de administrador do Supabase Auth.</p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-border-subtle bg-transparent px-3.5 py-2.5 text-sm outline-none"
          />
          {authError && <p className="text-xs text-danger">{authError}</p>}
          <Button fullWidth onClick={handleLogin}>Entrar</Button>
        </div>
      )}

      {configured && session && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-muted">
            Anúncios pendentes de moderação ({pending.length})
          </h2>
          {pending.map((row) => (
            <div key={row.id} className="space-y-2 rounded-xl border border-border-subtle p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{row.titulo}</span>
                <span>{formatBRL(row.preco)}</span>
              </div>
              <p className="text-xs text-text-muted">{row.bairro} · {row.finalidade}</p>
              <div className="flex gap-2">
                <button onClick={() => approve(row.id)} className="flex items-center gap-1 text-xs font-semibold text-emerald">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                </button>
                <button onClick={() => reject(row.id)} className="flex items-center gap-1 text-xs font-semibold text-danger">
                  <XCircle className="h-3.5 w-3.5" /> Rejeitar
                </button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-text-muted">Nenhum anúncio pendente.</p>}
        </div>
      )}
    </div>
  );
}
