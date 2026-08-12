import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCustomer } from "@/lib/auth/customer-dal";
import { logoutCustomer } from "@/lib/auth/customer-actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [customer, t] = await Promise.all([requireCustomer(), getTranslations("Account")]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              <p className="text-sm text-foreground/60">{t("signedInAs")}</p>
              <p className="font-semibold">{customer.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:gap-x-4 sm:text-sm">
              <Link href="/account" className="whitespace-nowrap font-medium text-brand hover:underline">
                {t("myAccount")}
              </Link>
              <Link href="/account/reservations" className="whitespace-nowrap font-medium text-brand hover:underline">
                {t("myReservations")}
              </Link>
              <form action={logoutCustomer}>
                <button type="submit" className="whitespace-nowrap font-medium text-foreground/60 hover:underline">
                  {t("signOut")}
                </button>
              </form>
            </div>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
