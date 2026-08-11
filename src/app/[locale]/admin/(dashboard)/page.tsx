import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCarsForAdmin } from "@/lib/cars";
import { formatEGP } from "@/lib/format";
import DeleteCarButton from "./DeleteCarButton";

export default async function AdminDashboardPage() {
  const [t, cars] = await Promise.all([
    getTranslations("AdminDashboard"),
    getAllCarsForAdmin(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <Link
          href="/admin/cars/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {t("addCar")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border bg-muted text-foreground/60">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("car")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("type")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("price")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-b border-border last:border-0">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded-md bg-placeholder">
                    <Image
                      src={car.images[0] ?? "/cars/sedan-silver.svg"}
                      alt={car.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="font-medium">{car.title}</span>
                </td>
                <td className="px-4 py-3 capitalize">{car.listing_type}</td>
                <td className="px-4 py-3 capitalize">{car.status}</td>
                <td className="px-4 py-3">
                  {formatEGP(car.listing_type === "rent" ? car.daily_price : car.sale_price)}
                  {car.listing_type === "rent" && (
                    <span className="text-foreground/50">{t("perDay")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="font-medium text-brand hover:underline"
                    >
                      {t("edit")}
                    </Link>
                    <DeleteCarButton id={car.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cars.length === 0 && (
          <p className="p-6 text-center text-foreground/60">{t("noCars")}</p>
        )}
      </div>
    </div>
  );
}
