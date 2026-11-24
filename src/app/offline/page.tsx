import { Logo } from "@/components/icons/Logo";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dark-green px-8 text-center text-off-white">
      <Logo size={40} variant="light" wordmarkClassName="text-2xl text-off-white" />
      <div className="flex flex-col items-center gap-3">
        <WifiOff className="h-10 w-10 text-emerald" />
        <h1 className="text-lg font-bold">Você está sem conexão</h1>
        <p className="max-w-xs text-sm text-off-white/70">
          O Moraí precisa de internet para carregar o mapa e os imóveis atualizados.
          Assim que a conexão voltar, toque para tentar novamente.
        </p>
      </div>
      <a
        href="/explorar"
        className="rounded-full bg-emerald px-6 py-3 text-sm font-bold text-dark-green active:scale-95 transition-transform"
      >
        Tentar novamente
      </a>
    </div>
  );
}
