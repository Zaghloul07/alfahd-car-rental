"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { confirmReturn } from "@/lib/reservations/confirm";

export default function ConfirmReturnButton({ reservationId }: { reservationId: string }) {
  const t = useTranslations("AdminReservations");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => confirmReturn(reservationId))}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? t("saving") : t("confirmReturn")}
    </button>
  );
}
