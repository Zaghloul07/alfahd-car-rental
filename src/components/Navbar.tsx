import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/auth/customer-dal";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

export default async function Navbar() {
  const [customer, t, cookieStore] = await Promise.all([
    getCurrentCustomer(),
    getTranslations("Nav"),
    cookies(),
  ]);
  const isDark = cookieStore.get("theme")?.value === "dark";

  const links = [
    { href: "/rent", label: t("rent") },
    { href: "/buy", label: t("buy") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur dark:bg-black/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/">
          <Logo className="h-16 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-foreground/80">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand">
              {link.label}
            </Link>
          ))}
          {customer ? (
            <Link href="/account" className="hover:text-brand">
              {t("myAccount")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand">
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-4 py-1.5 text-white hover:bg-accent/90"
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
