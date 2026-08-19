"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addReservationCharge } from "@/lib/reservations/charges-actions";

export default function AddChargeForm({ reservationId }: { reservationId: string }) {
  const t = useTranslations("Charges");
  const boundAction = addReservationCharge.bind(null, reservationId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium">{t("addChargeTitle")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("type")}</span>
          <select
            name="type"
            required
            defaultValue="charge"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="charge">{t("typeCharge")}</option>
            <option value="refund">{t("typeRefund")}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("amount")}</span>
          <input
            name="amount"
            type="number"
            min={0}
            step="0.01"
            required
            className="w-32 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("reason")}</span>
          <input
            name="reason"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? t("saving") : t("addCharge")}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
