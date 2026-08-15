import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getAllReservationsForAdmin } from "@/lib/reservations";
import { getSignedDocUrl } from "@/lib/customers/documents";
import { getHandoversForReservation } from "@/lib/handovers";
import { resolveHandoverForDisplay } from "@/lib/handovers/photos";
import { hasSubmittedDocuments } from "@/lib/auth/customer-dal";
import { requireAdmin } from "@/lib/auth/dal";
import { getChargesForReservation } from "@/lib/reservations/charges";
import { getDamageFindingsForReservation } from "@/lib/handovers/findings";
import HandoverSummary from "@/components/HandoverSummary";
import ChargesList from "@/components/ChargesList";
import AddChargeForm from "@/components/admin/AddChargeForm";
import HighlightTarget from "@/components/admin/HighlightTarget";
import ReservationActions from "./ReservationActions";
import ReservationConfirmPanel from "./ReservationConfirmPanel";
import CancelReservationButton from "./CancelReservationButton";
import HandoverForm from "./HandoverForm";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-brand/10 text-brand",
  confirmed: "bg-brand/10 text-brand",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  cancelled: "bg-muted text-foreground/60",
  delivered: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const HANDOVER_STATUSES = new Set(["confirmed", "delivered", "completed"]);

export default async function AdminReservationsPage() {
  await requireAdmin();
  const [t, tStatus, reservations] = await Promise.all([
    getTranslations("AdminReservations"),
    getTranslations("ReservationStatus"),
    getAllReservationsForAdmin(),
  ]);

  const rows = await Promise.all(
    reservations.map(async (r) => {
      const handovers = HANDOVER_STATUSES.has(r.status)
        ? await Promise.all((await getHandoversForReservation(r.id)).map(resolveHandoverForDisplay))
        : [];
      return {
        ...r,
        docs: {
          front: await getSignedDocUrl(r.customers?.national_id_front_url ?? null),
          back: await getSignedDocUrl(r.customers?.national_id_back_url ?? null),
          license: await getSignedDocUrl(r.customers?.driving_license_url ?? null),
        },
        docsComplete: r.customers ? hasSubmittedDocuments(r.customers) : false,
        delivery: handovers.find((h) => h.type === "delivery") ?? null,
        return: handovers.find((h) => h.type === "return") ?? null,
        charges: r.status === "completed" ? await getChargesForReservation(r.id) : [],
        damageFindings: r.status === "completed" ? await getDamageFindingsForReservation(r.id) : [],
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
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[r.status]}`}
              >
                {tStatus(r.status)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="text-sm">
                <p className="font-medium">{r.customers?.name ?? t("unknownCustomer")}</p>
                <p className="text-foreground/60">
                  {r.customers ? `0${r.customers.phone.slice(2)}` : "—"}
                </p>
                {r.notes && <p className="mt-2 text-foreground/70">&ldquo;{r.notes}&rdquo;</p>}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <DocLink label={t("idFront")} noneLabel={t("none")} viewLabel={t("view")} href={r.docs.front} />
                <DocLink label={t("idBack")} noneLabel={t("none")} viewLabel={t("view")} href={r.docs.back} />
                <DocLink label={t("license")} noneLabel={t("none")} viewLabel={t("view")} href={r.docs.license} />
              </div>
            </div>

            {r.status === "pending" && <ReservationActions reservationId={r.id} />}

            {r.status === "approved" && (
              <>
                <ReservationConfirmPanel
                  reservationId={r.id}
                  docsComplete={r.docsComplete}
                  amountPaid={r.amount_paid}
                />
                <div className="mt-4 flex justify-end">
                  <CancelReservationButton reservationId={r.id} />
                </div>
              </>
            )}

            {r.delivery && (
              <div className="mt-4 border-t border-border pt-4">
                <HandoverSummary handover={r.delivery} />
              </div>
            )}
            {r.status === "confirmed" && !r.delivery && (
              <>
                <div className="mt-4 flex justify-end">
                  <CancelReservationButton reservationId={r.id} />
                </div>
                <HandoverForm reservationId={r.id} type="delivery" />
              </>
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
              </div>
            )}
            {r.status === "delivered" && !r.return && (
              <HandoverForm reservationId={r.id} type="return" />
            )}

            {r.status === "completed" && (
              <>
                <ChargesList charges={r.charges} />
                <AddChargeForm reservationId={r.id} />
              </>
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

function DocLink({
  label,
  noneLabel,
  viewLabel,
  href,
}: {
  label: string;
  noneLabel: string;
  viewLabel: string;
  href: string | null;
}) {
  if (!href) {
    return (
      <span className="rounded-full bg-muted px-3 py-1 text-foreground/40">
        {label}: {noneLabel}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-brand/10 px-3 py-1 font-medium text-brand hover:bg-brand/20"
    >
      {viewLabel} {label}
    </a>
  );
}
