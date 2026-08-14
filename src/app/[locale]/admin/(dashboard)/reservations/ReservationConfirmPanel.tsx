"use client";

import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { markReservationPaid, confirmReservation } from "@/lib/reservations/confirm";
import { formatEGP } from "@/lib/format";

export default function ReservationConfirmPanel({
  reservationId,
  docsComplete,
  amountPaid,
}: {
  reservationId: string;
  docsComplete: boolean;
  amountPaid: number;
}) {
  const t = useTranslations("AdminReservations");
  const boundMarkPaid = markReservationPaid.bind(null, reservationId);
  const [state, formAction, pending] = useActionState(boundMarkPaid, undefined);
  const [confirmPending, startConfirmTransition] = useTransition();

  const canConfirm = docsComplete && amountPaid > 0;
  const badgeClass = (ok: boolean) =>
    ok
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className={`rounded-full px-3 py-1 font-medium ${badgeClass(docsComplete)}`}>
          {docsComplete ? t("docsComplete") : t("awaitingDocuments")}
        </span>
        <span className={`rounded-full px-3 py-1 font-medium ${badgeClass(amountPaid > 0)}`}>
          {amountPaid > 0 ? `${t("paid")}: ${formatEGP(amountPaid)}` : t("awaitingPayment")}
        </span>
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("amountPaid")}</span>
          <input
            name="amount"
            type="number"
            min={0}
            step="0.01"
            required
            className="w-32 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
        >
          {pending ? t("saving") : t("markPaid")}
        </button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="button"
        disabled={!canConfirm || confirmPending}
        onClick={() => startConfirmTransition(() => confirmReservation(reservationId))}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {confirmPending ? t("saving") : t("confirmReservation")}
      </button>
    </div>
  );
}
