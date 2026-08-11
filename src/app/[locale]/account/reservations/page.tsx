import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCustomer } from "@/lib/auth/customer-dal";
import { getReservationsForCustomer } from "@/lib/reservations";
import { getHandoversForReservation } from "@/lib/handovers";
import { resolveHandoverForDisplay } from "@/lib/handovers/photos";
import { formatEGP } from "@/lib/format";
import HandoverSummary from "@/components/HandoverSummary";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-brand/10 text-brand",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  cancelled: "bg-muted text-foreground/60",
  delivered: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const HANDOVER_STATUSES = new Set(["delivered", "completed"]);

export default async function MyReservationsPage() {
  const [t, tStatus, customer] = await Promise.all([
    getTranslations("Account"),
    getTranslations("ReservationStatus"),
    requireCustomer(),
  ]);
  const reservations = await getReservationsForCustomer(customer.id);
  const rows = await Promise.all(
    reservations.map(async (r) => ({
      ...r,
      handovers: HANDOVER_STATUSES.has(r.status)
        ? await Promise.all((await getHandoversForReservation(r.id)).map(resolveHandoverForDisplay))
        : [],
    }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("myReservations")}</h1>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-foreground/60">
          {t("noReservations")}{" "}
          <Link href="/rent" className="font-medium text-brand hover:underline">
            {t("browseCars")}
          </Link>
          .
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-placeholder">
                {r.cars && (
                  <Image
                    src={r.cars.images[0] ?? "/cars/sedan-silver.svg"}
                    alt={r.cars.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{r.cars?.title ?? t("carGone")}</p>
                <p className="text-sm text-foreground/60">
                  {r.start_date && r.end_date
                    ? `${r.start_date} → ${r.end_date}`
                    : t("datesNotSpecified")}
                </p>
                {r.cars?.daily_price && (
                  <p className="text-sm text-foreground/60">
                    {formatEGP(r.cars.daily_price)} {t("perDay")}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}
              >
                {tStatus(r.status)}
              </span>
            </div>

            {r.handovers.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {r.handovers.map((h, i) => (
                  <HandoverSummary key={i} handover={h} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
