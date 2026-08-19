import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { getCarById } from "@/lib/cars";
import { getReservationsForCar } from "@/lib/reports/queries";
import { formatEGP } from "@/lib/format";
import ReportsNav from "../../ReportsNav";

export default async function AdminReportCarDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [t, tStatus, car, rows] = await Promise.all([
    getTranslations("AdminReports"),
    getTranslations("ReservationStatus"),
    getCarById(id),
    getReservationsForCar(id),
  ]);

  if (!car) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>
      <ReportsNav active="cars" />

      <Link href="/admin/reports/cars" className="text-sm font-medium text-brand hover:underline">
        ← {t("backToReport")}
      </Link>

      <h2 className="mb-4 mt-4 text-lg font-semibold">{car.title}</h2>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-border bg-muted text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("dates")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("amountPaid")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fines")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("refunds")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const finesTotal = r.reservation_charges
                  .filter((c) => c.type !== "refund")
                  .reduce((sum, c) => sum + c.amount, 0);
                const refundsTotal = r.reservation_charges
                  .filter((c) => c.type === "refund")
                  .reduce((sum, c) => sum + c.amount, 0);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{r.customers?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground/70">
                      {r.start_date} → {r.end_date}
                    </td>
                    <td className="px-4 py-3">{tStatus(r.status)}</td>
                    <td className="px-4 py-3">{formatEGP(r.amount_paid)}</td>
                    <td className="px-4 py-3">{formatEGP(finesTotal)}</td>
                    <td className="px-4 py-3">{formatEGP(refundsTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-6 text-center text-foreground/60">{t("noReservationsYet")}</p>}
      </div>
    </div>
  );
}
