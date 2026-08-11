import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, t, cookieStore] = await Promise.all([
    requireAdmin(),
    getTranslations("AdminNav"),
    cookies(),
  ]);
  const isDark = cookieStore.get("theme")?.value === "dark";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white dark:bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo className="h-14 w-auto" priority />
            <span className="hidden text-lg font-bold text-brand sm:inline">{t("brand")}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="font-medium text-foreground/70 hover:text-brand">
              {t("cars")}
            </Link>
            <Link
              href="/admin/reservations"
              className="font-medium text-foreground/70 hover:text-brand"
            >
              {t("reservations")}
            </Link>
            <Link href="/" className="font-medium text-foreground/70 hover:text-brand">
              {t("viewSite")}
            </Link>
            <span className="text-foreground/60">{admin.email}</span>
            <form action={logout}>
              <button type="submit" className="font-medium text-brand hover:underline">
                {t("signOut")}
              </button>
            </form>
            <LanguageSwitcher />
            <ThemeToggle initialIsDark={isDark} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
