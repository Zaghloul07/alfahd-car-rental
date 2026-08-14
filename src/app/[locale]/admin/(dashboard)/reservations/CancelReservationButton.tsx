"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { cancelReservation } from "@/lib/reservations/confirm";

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const t = useTranslations("AdminReservations");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => cancelReservation(reservationId))}
      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-muted disabled:opacity-60"
    >
      {pending ? t("saving") : t("cancel")}
    </button>
  );
}
