import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";

export default async function Footer() {
  const [t, tNav] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Nav"),
  ]);

  return (
    <footer className="mt-24 border-t border-border bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-foreground/70">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <Logo className="h-14 w-auto" />
            <p className="mt-3 max-w-xs">{t("tagline")}</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="mb-2 font-semibold text-foreground">{t("explore")}</p>
              <ul className="space-y-1">
                <li>
                  <Link href="/rent" className="hover:text-brand">
                    {tNav("rent")}
                  </Link>
                </li>
                <li>
                  <Link href="/buy" className="hover:text-brand">
                    {tNav("buy")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold text-foreground">{t("company")}</p>
              <ul className="space-y-1">
                <li>
                  <Link href="/admin/login" className="hover:text-brand">
                    {t("admin")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-foreground/50">
          © {new Date().getFullYear()} AlFahd Car Rental. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
