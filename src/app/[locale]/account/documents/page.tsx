import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth/customer-dal";
import DocumentsForm from "./DocumentsForm";

export default async function DocumentsPage() {
  const [t, customer] = await Promise.all([
    getTranslations("Documents"),
    requireCustomer(),
  ]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-sm text-foreground/60">{t("subtitle")}</p>
      <DocumentsForm
        hasFront={Boolean(customer.national_id_front_url)}
        hasBack={Boolean(customer.national_id_back_url)}
        hasLicense={Boolean(customer.driving_license_url)}
      />
    </div>
  );
}
