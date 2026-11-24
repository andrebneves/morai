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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-surface/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-xl py-1.5 active:scale-95 transition-transform"
            >
              <Icon
                className={clsx("h-5 w-5", active ? "text-emerald" : "text-text-muted")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={clsx(
                  "text-[11px] font-medium",
                  active ? "text-emerald" : "text-text-muted",
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
