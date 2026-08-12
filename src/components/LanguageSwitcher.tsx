"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const other = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      className="flex h-9 items-center justify-center whitespace-nowrap rounded-lg border border-border px-2 text-xs font-medium text-foreground/70 hover:bg-muted sm:px-2.5 sm:text-sm"
    >
      {other === "ar" ? "العربية" : "English"}
    </button>
  );
}
