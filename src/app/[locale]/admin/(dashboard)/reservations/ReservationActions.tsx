"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { reviewReservation } from "@/lib/reservations/actions";

export default function ReservationActions({ reservationId }: { reservationId: string }) {
  const t = useTranslations("AdminReservations");
  const [pending, startTransition] = useTransition();

  function review(approve: boolean) {
    startTransition(() => {
      reviewReservation(reservationId, approve);
    });
  }

  return (
    <div className="mt-4 flex gap-3 border-t border-border pt-4">
      <button
        type="button"
        disabled={pending}
        onClick={() => review(true)}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {t("approve")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => review(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-muted disabled:opacity-60"
      >
        {t("reject")}
      </button>
    </div>
  );
}
