"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("CarDetail");
  const photos = images.length > 0 ? images : ["/cars/sedan-silver.svg"];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-placeholder">
        <Image src={photos[active]} alt={alt} fill priority className="object-cover" />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
              aria-label={t("previousPhoto")}
              className="absolute start-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % photos.length)}
              aria-label={t("nextPhoto")}
              className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white hover:bg-black/70"
            >
              ›
            </button>
            <span className="absolute bottom-2 end-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-brand" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
