import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarGallery from "@/components/CarGallery";
import { getCarById } from "@/lib/cars";
import { formatEGP, formatKm } from "@/lib/format";

export default async function BuyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const [t, tCard, car] = await Promise.all([
    getTranslations("CarDetail"),
    getTranslations("CarCard"),
    getCarById(id),
  ]);

  if (!car || car.listing_type !== "sale") notFound();

  const whatsappMessage = encodeURIComponent(
    `Hi, I'd like to make an offer on the ${car.title} listed at ${formatEGP(car.sale_price)}.`
  );

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CarGallery images={car.images} alt={car.title} />

            <div>
              <h1 className="text-2xl font-bold">{car.title}</h1>
              <p className="mt-1 text-foreground/60">
                {car.year} · {car.category} · {car.location}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {car.inspected && (
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    {tCard("inspected")}
                  </span>
                )}
                {car.price_negotiable && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70">
                    {t("priceNegotiable")}
                  </span>
                )}
                {car.installment_available && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70">
                    {t("installments")}
                  </span>
                )}
              </div>

              <p className="mt-6 text-3xl font-bold text-brand">{formatEGP(car.sale_price)}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 text-sm">
                <div>
                  <p className="text-foreground/50">{t("mileage")}</p>
                  <p className="font-semibold">{formatKm(car.mileage_km)}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("transmission")}</p>
                  <p className="font-semibold capitalize">{car.transmission ?? "—"}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("fuel")}</p>
                  <p className="font-semibold capitalize">{car.fuel_type ?? "—"}</p>
                </div>
                <div>
                  <p className="text-foreground/50">{t("year")}</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
              </div>

              {car.description && (
                <p className="mt-6 leading-relaxed text-foreground/80">{car.description}</p>
              )}

              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90"
              >
                {t("sendOffer")}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
