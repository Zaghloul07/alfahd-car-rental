import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { getAvailableMakes, getPublishedCars } from "@/lib/cars";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ make?: string; start?: string; end?: string }>;
}) {
  const { make, start, end } = await searchParams;
  const [t, cars, makes] = await Promise.all([
    getTranslations("Rent"),
    getPublishedCars("rent", { make, startDate: start, endDate: end }),
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
          <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
            {make && <input type="hidden" name="make" value={make} />}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground/70">{t("from")}</span>
              <input
                type="date"
                name="start"
                defaultValue={start}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground/70">{t("to")}</span>
              <input
                type="date"
                name="end"
                defaultValue={end}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("checkAvailability")}
            </button>
          </form>

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
