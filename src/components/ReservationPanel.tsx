"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReservationFormState } from "@/lib/reservations/actions";

type ReserveAction = (
  state: ReservationFormState,
  formData: FormData
) => Promise<ReservationFormState>;

type Props =
  | { status: "signed_out"; nextPath: string }
  | { status: "needs_documents" }
  | { status: "ready"; action: ReserveAction };

export default function ReservationPanel(props: Props) {
  const t = useTranslations("Reservation");

  if (props.status === "signed_out") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("signedOutTitle")}</p>
        <p className="mt-1 text-sm text-foreground/60">{t("signedOutSubtitle")}</p>
        <div className="mt-3 flex gap-3">
          <Link
            href={`/signup?next=${encodeURIComponent(props.nextPath)}`}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            {t("signUp")}
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(props.nextPath)}`}
            className="rounded-lg border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  if (props.status === "needs_documents") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("needsDocsTitle")}</p>
        <p className="mt-1 text-sm text-foreground/60">{t("needsDocsSubtitle")}</p>
        <Link
          href="/account/documents"
          className="mt-3 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90"
        >
          {t("uploadDocuments")}
        </Link>
      </div>
    );
  }

  return <ReservationForm action={props.action} />;
}

function ReservationForm({ action }: { action: ReserveAction }) {
  const t = useTranslations("Reservation");
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="mt-8 space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <p className="text-sm font-medium">{t("formTitle")}</p>
      <p className="text-xs text-foreground/60">{t("formSubtitle")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("from")}</span>
          <input
            name="start_date"
            type="date"
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("to")}</span>
          <input
            name="end_date"
            type="date"
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground/70">{t("notes")}</span>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
