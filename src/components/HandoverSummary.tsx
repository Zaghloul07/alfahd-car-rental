import { getTranslations } from "next-intl/server";
import type { ResolvedHandover } from "@/lib/handovers/photos";

export default async function HandoverSummary({ handover }: { handover: ResolvedHandover }) {
  const t = await getTranslations("Handover");

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {handover.type === "delivery" ? t("deliveryReport") : t("returnReport")}
        </p>
        <p className="text-xs text-foreground/50">
          {new Date(handover.created_at).toLocaleString()}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="text-foreground/60">{t("odometer")}: </span>
          {handover.odometer_km.toLocaleString()} km
        </p>
        <p>
          <span className="text-foreground/60">{t("fuelLevel")}: </span>
          {t(`fuelLevel_${handover.fuel_level}`)}
        </p>
      </div>

      {handover.notes && (
        <p className="mt-2 text-sm text-foreground/70">&ldquo;{handover.notes}&rdquo;</p>
      )}

      {handover.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {handover.photos.map(
            (p, i) =>
              p.url && (
                <a
                  key={i}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative h-16 w-24 overflow-hidden rounded-md border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.photo_type} className="h-full w-full object-cover" />
                </a>
              )
          )}
        </div>
      )}

      {handover.signatureUrl && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-foreground/60">{t("customerSignature")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={handover.signatureUrl}
            alt={t("customerSignature")}
            className="h-16 rounded-md border border-border bg-white"
          />
        </div>
      )}
    </div>
  );
}
