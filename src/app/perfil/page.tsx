"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Smartphone,
  Car,
  ShieldCheck,
  MessageSquarePlus,
  Trash2,
  ChevronRight,
  Share2,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/icons/Logo";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAppStore, type ThemePreference } from "@/lib/store/useAppStore";
import { submitFeedback } from "@/lib/data/feedback";
import type { FeedbackEntry } from "@/lib/types";

const FEEDBACK_TIPOS: { value: FeedbackEntry["tipo"]; label: string }[] = [
  { value: "sugestao", label: "Sugestão" },
  { value: "erro", label: "Relato de erro" },
  { value: "localizacao", label: "Problema de localização" },
  { value: "instalacao", label: "Problema de instalação" },
  { value: "funcionalidade", label: "Funcionalidade desejada" },
];

export default function PerfilPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [tipo, setTipo] = useState<FeedbackEntry["tipo"]>("sugestao");
  const [nota, setNota] = useState(5);
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleTheme = (t: ThemePreference) => {
    setTheme(t);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", t === "system" ? "" : t);
    }
  };

  const handleFeedback = async () => {
    if (!mensagem.trim()) return;
    await submitFeedback({ tipo, nota, mensagem });
    setEnviado(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setEnviado(false);
      setMensagem("");
    }, 1200);
  };

  const clearLocalData = () => {
    if (confirm("Isso vai apagar favoritos, filtros e preferências salvas neste dispositivo. Continuar?")) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="space-y-6 px-5 pt-safe">
        <div className="flex items-center justify-between">
          <Logo size={26} wordmarkClassName="text-lg" />
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold">Beta 1.0</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-muted">Aparência</h2>
          <div className="flex gap-2">
            <ThemeButton icon={<Sun className="h-4 w-4" />} label="Claro" active={theme === "light"} onClick={() => handleTheme("light")} />
            <ThemeButton icon={<Moon className="h-4 w-4" />} label="Escuro" active={theme === "dark"} onClick={() => handleTheme("dark")} />
            <ThemeButton icon={<Smartphone className="h-4 w-4" />} label="Sistema" active={theme === "system"} onClick={() => handleTheme("system")} />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-muted">Mais</h2>
          <MenuItem icon={<Share2 className="h-4 w-4" />} label="Como instalar o Moraí" onClick={() => setInstallOpen(true)} />
          <Link href="/drive">
            <MenuItem icon={<Car className="h-4 w-4" />} label="Moraí Drive (CarPlay / Android Auto)" />
          </Link>
          <MenuItem icon={<MessageSquarePlus className="h-4 w-4" />} label="Ajude a melhorar o Moraí" onClick={() => setFeedbackOpen(true)} />
          <Link href="/admin">
            <MenuItem icon={<ShieldCheck className="h-4 w-4" />} label="Painel administrativo" />
          </Link>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-muted">Privacidade e dados</h2>
          <p className="text-xs leading-relaxed text-text-muted">
            O Moraí usa sua localização apenas no seu dispositivo, para centralizar o mapa e calcular
            distâncias. Não compartilhamos sua localização com terceiros nem armazenamos seu trajeto sem
            consentimento específico (Minha Busca). Dados de favoritos e preferências ficam salvos
            localmente neste dispositivo até que você crie uma conta. Em conformidade com a LGPD, você
            pode apagar todos os dados locais a qualquer momento.
          </p>
          <button onClick={clearLocalData} className="flex items-center gap-1.5 text-xs font-semibold text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Apagar meus dados locais
          </button>
          <div className="flex gap-4 pt-1 text-xs font-semibold text-emerald">
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/termos">Termos de Utilização</Link>
          </div>
        </section>

        <p className="pt-4 text-center text-[11px] text-text-muted">
          Moraí Beta 1.0 · Todos os imóveis desta versão são demonstrativos.
        </p>
      </div>

      <BottomSheet open={installOpen} onClose={() => setInstallOpen(false)} maxHeightVh={70}>
        <InstallGuide />
      </BottomSheet>

      <BottomSheet open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxHeightVh={80}>
        <div className="space-y-4 px-5 pb-6 pt-2">
          <h2 className="text-lg font-bold">Ajude a melhorar o Moraí</h2>
          {enviado ? (
            <p className="text-sm text-emerald">Obrigado! Seu feedback foi enviado.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TIPOS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      tipo === t.value ? "border-emerald bg-emerald text-dark-green" : "border-border-subtle"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">Avaliação geral</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNota(n)}
                      className={`h-9 w-9 rounded-full text-sm font-bold ${
                        nota >= n ? "bg-lime text-dark-green" : "bg-surface-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Conte o que podemos melhorar..."
                className="min-h-28 w-full rounded-xl border border-border-subtle bg-transparent p-3 text-sm outline-none"
              />
              <Button fullWidth size="lg" onClick={handleFeedback}>
                Enviar feedback
              </Button>
            </>
          )}
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
}

function ThemeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold ${
        active ? "border-emerald bg-emerald/10 text-emerald" : "border-border-subtle"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border-subtle px-4 py-3.5 text-left text-sm font-medium"
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-text-muted" />
    </button>
  );
}

function InstallGuide() {
  return (
    <div className="space-y-4 px-5 pb-6 pt-2">
      <h2 className="text-lg font-bold">Como instalar o Moraí</h2>
      <div className="space-y-3">
        <Step n={1} text="Abra o link do Moraí no Safari (iPhone) ou Chrome (Android)." />
        <Step n={2} text='No iPhone, toque no ícone de Compartilhar (quadrado com seta para cima).' />
        <Step n={3} text='Selecione "Adicionar à Tela de Início".' />
        <Step n={4} text="Abra o Moraí pelo ícone na tela de início, como um app normal." />
      </div>
      <p className="text-xs text-text-muted">
        No Android, o Chrome pode mostrar automaticamente o banner &quot;Instalar app&quot; — ou use o menu
        (⋮) e toque em &quot;Instalar aplicativo&quot;.
      </p>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-dark-green">
        {n}
      </span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
