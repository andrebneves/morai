"use client";

import { ExternalLink } from "lucide-react";

export function RouteButtons({ lat, lng, titulo }: { lat: number; lng: number; titulo: string }) {
  const apple = `https://maps.apple.com/?daddr=${lat},${lng}`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const waze = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  const links = [
    { label: "Apple Maps", href: apple },
    { label: "Google Maps", href: google },
    { label: "Waze", href: waze },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        A navegação abre no aplicativo externo escolhido. No iPhone, você pode continuar a rota pelo
        Apple Maps com o CarPlay.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle py-3 text-xs font-semibold"
          >
            <ExternalLink className="h-4 w-4 text-emerald" />
            {l.label}
          </a>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">Imóvel: {titulo}</p>
    </div>
  );
}
