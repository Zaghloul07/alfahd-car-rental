import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/auth/customer-dal";
import { getUnreadCountForCustomer } from "@/lib/notifications/queries";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import CustomerNotificationBell from "@/components/CustomerNotificationBell";

export default async function Navbar() {
  const [customer, t, cookieStore] = await Promise.all([
    getCurrentCustomer(),
    getTranslations("Nav"),
    cookies(),
  ]);
  const isDark = cookieStore.get("theme")?.value === "dark";
  const unreadCount = customer ? await getUnreadCountForCustomer(customer.id) : 0;

  const links = [
    { href: "/rent", label: t("rent") },
    { href: "/buy", label: t("buy") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur dark:bg-black/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Logo className="h-10 w-auto sm:h-16" priority />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-medium text-foreground/80 sm:gap-x-4 sm:text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-brand">
              {link.label}
            </Link>
          ))}
          {customer ? (
            <>
              <Link href="/account" className="whitespace-nowrap hover:text-brand">
                {t("myAccount")}
              </Link>
              <CustomerNotificationBell initialCount={unreadCount} />
            </>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap hover:text-brand">
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-lg bg-accent px-3 py-1 text-white hover:bg-accent/90 sm:px-4 sm:py-1.5"
              >
                {t("signUp")}
              </Link>
            </>
          )}
          <LanguageSwitcher />
          <ThemeToggle initialIsDark={isDark} />
        </nav>
      </div>
    </header>
  );
}
