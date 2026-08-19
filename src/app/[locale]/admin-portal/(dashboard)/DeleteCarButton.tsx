"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteCar } from "@/lib/cars/actions";

export default function DeleteCarButton({ id }: { id: string }) {
  const t = useTranslations("AdminDashboard");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(() => {
      deleteCar(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="font-medium text-red-600 hover:underline disabled:opacity-60"
    >
      {pending ? t("deleting") : t("delete")}
    </button>
  );
}
