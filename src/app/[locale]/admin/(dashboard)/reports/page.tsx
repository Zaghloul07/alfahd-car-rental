import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/dal";
import { getOverviewStats, getReservationsByStatus, getRevenueByMonth } from "@/lib/reports/queries";
import { formatEGP } from "@/lib/format";
import ReportsNav from "./ReportsNav";
import ReservationsByStatusChart from "@/components/admin/charts/ReservationsByStatusChart";
import RevenueByMonthChart from "@/components/admin/charts/RevenueByMonthChart";

export default async function AdminReportsOverviewPage() {
  await requireAdmin();
  const [t, stats, statusBreakdown, revenue] = await Promise.all([
    getTranslations("AdminReports"),
    getOverviewStats(),
    getReservationsByStatus(),
    getRevenueByMonth(6),
  ]);

  const tiles = [
    { label: t("activeReservations"), value: String(stats.activeReservations) },
    { label: t("pendingApprovals"), value: String(stats.pendingApprovals) },
    { label: t("upcomingDeliveries"), value: String(stats.upcomingDeliveries) },
    { label: t("revenueThisMonth"), value: formatEGP(stats.revenueThisMonth) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("title")}</h1>
      <ReportsNav active="overview" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-foreground/60">{tile.label}</p>
            <p className="mt-1 text-2xl font-bold">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">{t("reservationsByStatus")}</p>
          <ReservationsByStatusChart data={statusBreakdown} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">{t("revenueByMonth")}</p>
          <RevenueByMonthChart data={revenue} />
        </div>
      </div>
    </div>
  );
}
