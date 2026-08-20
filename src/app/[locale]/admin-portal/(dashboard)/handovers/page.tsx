import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getReservationsForHandoverQueue } from "@/lib/reservations/handover-queue";
import { getHandoversForReservation } from "@/lib/handovers";
import { resolveHandoverForDisplay } from "@/lib/handovers/photos";
import { getDamageFindingsForReservation } from "@/lib/handovers/findings";
import HandoverSummary from "@/components/HandoverSummary";
import HandoverForm from "../reservations/HandoverForm";
import HighlightTarget from "@/components/admin/HighlightTarget";

export default async function AdminHandoversPage() {
  const [t, tStatus, reservations] = await Promise.all([
    getTranslations("AdminHandovers"),
    getTranslations("ReservationStatus"),
    getReservationsForHandoverQueue(),
  ]);

  const rows = await Promise.all(
    reservations.map(async (r) => {
      const handovers = await Promise.all(
        (await getHandoversForReservation(r.id)).map(resolveHandoverForDisplay)
      );
      const returnHandover = handovers.find((h) => h.type === "return") ?? null;
      return {
        ...r,
        delivery: handovers.find((h) => h.type === "delivery") ?? null,
        return: returnHandover,
        damageFindings: returnHandover ? await getDamageFindingsForReservation(r.id) : [],
      };
    })
  );

  return (
    <div>
      <HighlightTarget />
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>

      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} id={`reservation-${r.id}`} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-placeholder">
                  {r.cars && (
                    <Image
                      src={r.cars.images[0] ?? "/cars/sedan-silver.svg"}
                      alt={r.cars.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{r.cars?.title ?? t("carGone")}</p>
                  <p className="text-sm text-foreground/60">
                    {r.start_date} → {r.end_date}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {r.customers?.name ?? t("unknownCustomer")} ·{" "}
                    {r.customers ? `0${r.customers.phone.slice(2)}` : "—"}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                {tStatus(r.status)}
              </span>
            </div>

            {r.delivery && (
              <div className="mt-4 border-t border-border pt-4">
                <HandoverSummary handover={r.delivery} />
              </div>
            )}
            {r.status === "confirmed" && !r.delivery && (
              <HandoverForm reservationId={r.id} type="delivery" />
            )}

            {r.return && (
              <div className="mt-4 border-t border-border pt-4">
                <HandoverSummary
                  handover={r.return}
                  period={
                    r.start_date && r.end_date && r.cars?.daily_price != null
                      ? { startDate: r.start_date, endDate: r.end_date, dailyPrice: r.cars.daily_price }
                      : undefined
                  }
                  findings={r.damageFindings}
                />
                {r.status === "delivered" && (
                  <p className="mt-2 text-xs text-foreground/50">{t("returnAwaitingConfirmation")}</p>
                )}
              </div>
            )}
            {r.status === "delivered" && !r.return && (
              <HandoverForm reservationId={r.id} type="return" />
            )}
          </div>
        ))}

        {rows.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-foreground/60">
            {t("noReservations")}
          </p>
        )}
      </div>
    </div>
  );
}
