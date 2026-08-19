import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ReportsNav({ active }: { active: "overview" | "cars" | "customers" }) {
  const t = await getTranslations("AdminReports");
  const tabs = [
    { key: "overview", href: "/admin/reports", label: t("overview") },
    { key: "cars", href: "/admin/reports/cars", label: t("byCar") },
    { key: "customers", href: "/admin/reports/customers", label: t("byCustomer") },
  ] as const;

  return (
    <div className="mb-6 flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            active === tab.key ? "border-brand bg-brand text-white" : "border-border text-foreground/70"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
