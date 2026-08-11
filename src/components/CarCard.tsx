import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CarRow } from "@/lib/supabase/types";
import { formatEGP, formatKm } from "@/lib/format";

export default function CarCard({ car }: { car: CarRow }) {
  const t = useTranslations("CarCard");
  const href = car.listing_type === "rent" ? `/rent/${car.id}` : `/buy/${car.id}`;
  const image = car.images[0] ?? "/cars/sedan-silver.svg";

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full bg-placeholder">
        <Image
          src={image}
          alt={car.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {car.listing_type === "sale" && car.inspected && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-xs font-medium text-white">
            {t("inspected")}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground">{car.title}</h3>
        <p className="mt-0.5 text-sm text-foreground/60">
          {car.year} · {car.category ?? car.transmission ?? ""} · {car.location}
        </p>

        {car.listing_type === "rent" ? (
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-lg font-bold text-brand">{formatEGP(car.daily_price)}</span>
            <span className="text-xs text-foreground/60">{t("perDay")}</span>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-brand">{formatEGP(car.sale_price)}</span>
              {car.price_negotiable && (
                <span className="text-xs text-foreground/60">{t("negotiable")}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-foreground/60">{formatKm(car.mileage_km)}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
