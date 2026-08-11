import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { getAvailableMakes, getPublishedCars } from "@/lib/cars";

const PRICE_BUCKETS = [
  { key: "priceUnder500k", min: undefined, max: 500000 },
  { key: "price500kTo1m", min: 500000, max: 1000000 },
  { key: "price1mTo2m", min: 1000000, max: 2000000 },
  { key: "price2mPlus", min: 2000000, max: undefined },
] as const;

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; min?: string; max?: string }>;
}) {
  const { make, min, max } = await searchParams;
  const minPrice = min ? Number(min) : undefined;
  const maxPrice = max ? Number(max) : undefined;

  const [t, cars, makes] = await Promise.all([
    getTranslations("Buy"),
    getPublishedCars("sale", { make, minPrice, maxPrice }),
    getAvailableMakes("sale"),
  ]);

  function bucketHref(bucket: (typeof PRICE_BUCKETS)[number]) {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (bucket.min) params.set("min", String(bucket.min));
    if (bucket.max) params.set("max", String(bucket.max));
    return `/buy?${params.toString()}`;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-brand-dark px-4 py-14 text-white">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-white/70">{t("subtitle")}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/buy${make ? `?make=${encodeURIComponent(make)}` : ""}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                !min && !max
                  ? "border-brand bg-brand text-white"
                  : "border-border text-foreground/70"
              }`}
            >
              {t("anyPrice")}
            </Link>
            {PRICE_BUCKETS.map((bucket) => {
              const active = minPrice === bucket.min && maxPrice === bucket.max;
              return (
                <Link
                  key={bucket.key}
                  href={bucketHref(bucket)}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-border text-foreground/70"
                  }`}
                >
                  {t(bucket.key)}
                </Link>
              );
            })}
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-2">
            <Link
              href="/buy"
              className={`rounded-full border px-4 py-1.5 text-sm ${
                !make ? "border-brand bg-brand text-white" : "border-border text-foreground/70"
              }`}
            >
              {t("allMakes")}
            </Link>
            {makes.map((m) => (
              <Link
                key={m}
                href={`/buy?make=${encodeURIComponent(m)}`}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  make === m
                    ? "border-brand bg-brand text-white"
                    : "border-border text-foreground/70"
                }`}
              >
                {m}
              </Link>
            ))}
          </div>

          {cars.length === 0 ? (
            <p className="text-foreground/60">{t("noCars")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
