import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireInspectorOrAdmin } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { getUnreadCount } from "@/lib/notifications/queries";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/admin/NotificationBell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, t, cookieStore] = await Promise.all([
    requireInspectorOrAdmin(),
    getTranslations("AdminNav"),
    cookies(),
  ]);
  const isDark = cookieStore.get("theme")?.value === "dark";
  const isFullAdmin = admin.is_admin;
  const unreadCount = await getUnreadCount(admin);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white dark:bg-black">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link
            href={isFullAdmin ? "/admin-portal" : "/admin-portal/handovers"}
            className="flex shrink-0 items-center gap-3"
          >
            <Logo className="h-10 w-auto sm:h-14" priority />
            <span className="hidden text-lg font-bold text-brand sm:inline">{t("brand")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:gap-x-4 sm:text-sm">
            {isFullAdmin && (
              <>
                <Link href="/admin-portal" className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand">
                  {t("cars")}
                </Link>
                <Link
                  href="/admin-portal/reservations"
                  className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand"
                >
                  {t("reservations")}
                </Link>
                <Link
                  href="/admin-portal/reports"
                  className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand"
                >
                  {t("reports")}
                </Link>
                <Link
                  href="/admin-portal/users"
                  className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand"
                >
                  {t("users")}
                </Link>
              </>
            )}
            <Link
              href="/admin-portal/handovers"
              className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand"
            >
              {t("handovers")}
            </Link>
            <Link href="/" className="whitespace-nowrap font-medium text-foreground/70 hover:text-brand">
              {t("viewSite")}
            </Link>
            <span className="hidden whitespace-nowrap text-foreground/60 sm:inline">{admin.email}</span>
            <form action={logout}>
              <button type="submit" className="whitespace-nowrap font-medium text-brand hover:underline">
                {t("signOut")}
              </button>
            </form>
            <NotificationBell initialCount={unreadCount} />
            <LanguageSwitcher />
            <ThemeToggle initialIsDark={isDark} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
