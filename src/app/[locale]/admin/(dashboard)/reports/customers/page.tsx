import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { getCustomerReport } from "@/lib/reports/queries";
import { formatEGP } from "@/lib/format";
import ReportsNav from "../ReportsNav";

export default async function AdminReportsCustomersPage() {
  await requireAdmin();
  const [t, rows] = await Promise.all([getTranslations("AdminReports"), getCustomerReport()]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>
      <ReportsNav active="customers" />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-border bg-muted text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("mobileNumber")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("reservations")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("totalPaid")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fines")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.customerId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/reports/customers/${row.customerId}`} className="text-brand hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">0{row.phone.slice(2)}</td>
                  <td className="px-4 py-3">{row.reservationCount}</td>
                  <td className="px-4 py-3">{formatEGP(row.totalPaid)}</td>
                  <td className="px-4 py-3">{formatEGP(row.finesTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-6 text-center text-foreground/60">{t("noData")}</p>}
      </div>
    </div>
  );
}
