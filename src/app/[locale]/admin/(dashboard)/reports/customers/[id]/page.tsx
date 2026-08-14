import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getReservationsForCustomer } from "@/lib/reports/queries";
import { formatEGP } from "@/lib/format";
import ReportsNav from "../../ReportsNav";

export default async function AdminReportCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const [t, tStatus, { data: customer }, rows] = await Promise.all([
    getTranslations("AdminReports"),
    getTranslations("ReservationStatus"),
    supabase.from("customers").select("id, name, phone").eq("id", id).maybeSingle(),
    getReservationsForCustomer(id),
  ]);

  if (!customer) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>
      <ReportsNav active="customers" />

      <Link href="/admin/reports/customers" className="text-sm font-medium text-brand hover:underline">
        ← {t("backToReport")}
      </Link>

      <h2 className="mb-4 mt-4 text-lg font-semibold">
        {customer.name} · 0{customer.phone.slice(2)}
      </h2>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-border bg-muted text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("car")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("dates")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("amountPaid")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fines")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const finesTotal = r.reservation_charges.reduce((sum, c) => sum + c.amount, 0);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{r.cars?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground/70">
                      {r.start_date} → {r.end_date}
                    </td>
                    <td className="px-4 py-3">{tStatus(r.status)}</td>
                    <td className="px-4 py-3">{formatEGP(r.amount_paid)}</td>
                    <td className="px-4 py-3">{formatEGP(finesTotal)}</td>
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
