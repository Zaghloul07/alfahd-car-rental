import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReservationPanel from "@/components/ReservationPanel";
import { getCarById } from "@/lib/cars";
import { formatEGP, formatKm } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/auth/customer-dal";
import { createReservation } from "@/lib/reservations/actions";
import { getUnavailableDateRanges } from "@/lib/reservations/availability";

export default async function RentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const { start, end } = await searchParams;
  const [t, car, customer] = await Promise.all([
    getTranslations("CarDetail"),
    getCarById(id),
    getCurrentCustomer(),
  ]);

  if (!car || car.listing_type !== "rent") notFound();

  const blockedRanges = await getUnavailableDateRanges(car.id);

  const whatsappMessage = encodeURIComponent(
    `Hi, I'd like to rent the ${car.title} (${car.location}).`
  );

  const reservationProps = !customer
    ? ({
        status: "signed_out",
        nextPath: `/rent/${car.id}`,
        blockedRanges,
        defaultStart: start,
        defaultEnd: end,
      } as const)
    : ({
        status: "ready",
        action: createReservation.bind(null, car.id),
        blockedRanges,
        defaultStart: start,
        defaultEnd: end,
      } as const);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-placeholder">
              <Image src={car.images[0] ?? "/cars/sedan-silver.svg"} alt={car.title} fill className="object-cover" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">{car.title}</h1>
              <p className="mt-1 text-foreground/60">
                {car.year} · {car.category} · {car.location}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 text-sm">
                <div>
                  <p className="text-foreground/50">{t("dailyRate")}</p>
                  <p className="font-semibold">{formatEGP(car.daily_price)}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("monthlyRate")}</p>
                  <p className="font-semibold">{formatEGP(car.monthly_price)}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("transmission")}</p>
                  <p className="font-semibold capitalize">{car.transmission ?? "—"}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("mileage")}</p>
                  <p className="font-semibold">{formatKm(car.mileage_km)}</p>
                </div>
              </div>

              {car.description && (
                <p className="mt-6 leading-relaxed text-foreground/80">{car.description}</p>
              )}

              <ReservationPanel {...reservationProps} />

              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
              >
                {t("contactWhatsapp")}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
