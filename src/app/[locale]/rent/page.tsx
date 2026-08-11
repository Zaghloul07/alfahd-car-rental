import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { getAvailableMakes, getPublishedCars } from "@/lib/cars";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string }>;
}) {
  const { make } = await searchParams;
  const [t, cars, makes] = await Promise.all([
    getTranslations("Rent"),
    getPublishedCars("rent", { make }),
    getAvailableMakes("rent"),
  ]);

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
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Link
              href="/rent"
              className={`rounded-full border px-4 py-1.5 text-sm ${
                !make ? "border-brand bg-brand text-white" : "border-border text-foreground/70"
              }`}
            >
              {t("allMakes")}
            </Link>
            {makes.map((m) => (
              <Link
                key={m}
                href={`/rent?make=${encodeURIComponent(m)}`}
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
