import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { getPublishedCars } from "@/lib/cars";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const [rentCars, saleCars] = await Promise.all([
    getPublishedCars("rent"),
    getPublishedCars("sale"),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-brand-dark px-4 py-20 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className="text-3xl font-bold sm:text-5xl">{t("heroTitle")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-white/70">{t("heroSubtitle")}</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/rent"
                className="rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90"
              >
                {t("rentCta")}
              </Link>
              <Link
                href="/buy"
                className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                {t("buyCta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("availableToRent")}</h2>
            <Link href="/rent" className="text-sm font-medium text-brand hover:underline">
              {t("seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rentCars.slice(0, 3).map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("availableToBuy")}</h2>
            <Link href="/buy" className="text-sm font-medium text-brand hover:underline">
              {t("seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saleCars.slice(0, 3).map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
