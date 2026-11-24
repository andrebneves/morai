"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative">
      <div
        className="flex h-72 snap-x snap-mandatory overflow-x-auto no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          setIndex(i);
        }}
      >
        {fotos.map((foto, i) => (
          <div key={i} className="relative h-72 w-full shrink-0 snap-center">
            <Image src={foto} alt={`${titulo} — foto ${i + 1}`} fill className="object-cover" unoptimized priority={i === 0} />
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {fotos.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
        {index + 1}/{fotos.length}
      </span>
    </div>
  );
}
