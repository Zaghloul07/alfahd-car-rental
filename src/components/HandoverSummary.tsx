import { getTranslations } from "next-intl/server";
import type { ResolvedHandover } from "@/lib/handovers/photos";
import { formatEGP } from "@/lib/format";

type RentalPeriod = { startDate: string; endDate: string; dailyPrice: number };

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export default async function HandoverSummary({
  handover,
  period,
}: {
  handover: ResolvedHandover;
  period?: RentalPeriod;
}) {
  const t = await getTranslations("Handover");

  const pricing =
    handover.type === "return" && handover.return_date && period
      ? (() => {
          const agreedDays = daysBetween(period.startDate, period.endDate);
          const actualDays = daysBetween(period.startDate, handover.return_date!);
          const agreedCost = agreedDays * period.dailyPrice;
          const actualCost = actualDays * period.dailyPrice;
          return { agreedDays, actualDays, agreedCost, actualCost, diff: actualCost - agreedCost };
        })()
      : null;

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

      {pricing && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
          <p>
            <span className="text-foreground/60">{t("agreedPeriod")}: </span>
            {pricing.agreedDays} {t("days")} · {formatEGP(pricing.agreedCost)}
          </p>
          <p>
            <span className="text-foreground/60">{t("actualPeriod")}: </span>
            {pricing.actualDays} {t("days")} · {formatEGP(pricing.actualCost)}
          </p>
          {pricing.diff !== 0 && (
            <p className="col-span-2 font-medium">
              {pricing.diff > 0 ? t("additionalDue") : t("refundDue")}: {formatEGP(Math.abs(pricing.diff))}
            </p>
          )}
        </div>
      )}

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
