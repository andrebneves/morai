"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Compass, PlusCircle, Heart, User } from "lucide-react";
import clsx from "clsx";

const ITEMS = [
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/anunciar", label: "Anunciar", icon: PlusCircle },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/perfil", label: "Perfil", icon: User },
];

/** Barra sempre verde-escuro (cor fixa da marca, não segue o tema claro/escuro) com a aba
 * ativa num "selo" lima — mesma dupla de cores do símbolo do Moraí, pra ficar reconhecível
 * de longe, igual um HUD de jogo. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-dark-green pb-safe shadow-[0_-10px_28px_rgba(6,42,36,0.35)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 pt-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-[60px] flex-1 flex-col items-center gap-1 py-1.5 active:scale-90 transition-transform"
            >
              <span
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  active ? "bg-lime shadow-[0_3px_0_rgba(6,42,36,0.35)]" : "bg-transparent",
                )}
              >
                <Icon
                  className={clsx("h-[18px] w-[18px]", active ? "text-dark-green" : "text-off-white/55")}
                  strokeWidth={active ? 2.6 : 2.1}
                />
              </span>
              <span
                className={clsx(
                  "text-[10.5px] font-bold tracking-tight",
                  active ? "text-lime" : "text-off-white/50",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
