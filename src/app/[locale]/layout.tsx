import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

// Only needed for a visitor's very first-ever pageview, before the "theme"
// cookie exists — detects system preference and stores it as a cookie so
// every render after this one (including client-side locale switches, which
// re-render this layout's <html> and would otherwise wipe out a class added
// only via classList) gets the theme from the server instead.
//
// Deliberately "afterInteractive", not "beforeInteractive": this layout
// re-renders on the client during locale switches (it's the dynamic root
// layout), and "beforeInteractive" scripts render as a literal <script>
// element that React re-injects into the tree on every such re-render —
// browsers don't execute a script tag that arrives via reconciliation
// rather than raw parsed HTML, so React (correctly) warns about it.
// "afterInteractive" runs via appendChild instead of JSX, which actually
// executes and never triggers that warning, at the cost of running a beat
// after hydration instead of strictly before it.
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    if (document.cookie.indexOf("theme=") !== -1) return;
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
    document.cookie = "theme=" + (dark ? "dark" : "light") + "; path=/; max-age=31536000; samesite=lax";
  } catch (e) {}
})();
`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  return {
    title: `AlFahd — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = locale === "ar" ? "rtl" : "ltr";
  const cookieStore = await cookies();
  const isDark = cookieStore.get("theme")?.value === "dark";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased ${isDark ? "dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script id="theme-boot" strategy="afterInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
