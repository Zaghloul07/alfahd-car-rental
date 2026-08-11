import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCustomer, hasSubmittedDocuments } from "@/lib/auth/customer-dal";

export default async function AccountPage() {
  const [t, customer] = await Promise.all([getTranslations("Account"), requireCustomer()]);
  const complete = hasSubmittedDocuments(customer);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold">{t("accountDetails")}</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/60">{t("name")}</dt>
            <dd className="font-medium">{customer.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">{t("mobileNumber")}</dt>
            <dd className="font-medium">0{customer.phone.slice(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">{t("verificationDocs")}</h2>
            <p className="mt-1 text-sm text-foreground/60">
              {complete ? t("docsCompleteDesc") : t("docsIncompleteDesc")}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              complete
                ? "bg-brand/10 text-brand"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            }`}
          >
            {complete ? t("complete") : t("incomplete")}
          </span>
        </div>
        <Link
          href="/account/documents"
          className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {complete ? t("updateDocuments") : t("uploadDocuments")}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">{t("myReservations")}</h2>
        <p className="mt-1 text-sm text-foreground/60">{t("reservationsDesc")}</p>
        <Link
          href="/account/reservations"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          {t("viewReservations")} →
        </Link>
      </div>
    </div>
  );
}
