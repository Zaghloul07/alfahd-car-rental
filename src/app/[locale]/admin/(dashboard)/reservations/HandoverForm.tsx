"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitHandover } from "@/lib/handovers/actions";
import SignaturePad from "@/components/SignaturePad";
import ImageUploadField from "@/components/ImageUploadField";
import type { FuelLevel, HandoverType } from "@/lib/supabase/types";

const FUEL_LEVELS: FuelLevel[] = ["empty", "quarter", "half", "three_quarter", "full"];

export default function HandoverForm({
  reservationId,
  type,
}: {
  reservationId: string;
  type: HandoverType;
}) {
  const t = useTranslations("Handover");
  const boundAction = submitHandover.bind(null, reservationId, type);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-4 border-t border-border pt-4">
      <p className="font-semibold">
        {type === "delivery" ? t("deliveryFormTitle") : t("returnFormTitle")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("odometer")}</span>
          <input
            name="odometer_km"
            type="number"
            min={0}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("fuelLevel")}</span>
          <select
            name="fuel_level"
            required
            defaultValue=""
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              {t("selectFuelLevel")}
            </option>
            {FUEL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`fuelLevel_${level}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t("notes")}</span>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("odometerPhoto")}</span>
          <ImageUploadField
            name="odometer_photo"
            multiple={false}
            capture="environment"
            required
            removeLabel={t("removePhoto")}
            className="w-full text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t("fuelPhoto")}</span>
          <ImageUploadField
            name="fuel_photo"
            multiple={false}
            capture="environment"
            required
            removeLabel={t("removePhoto")}
            className="w-full text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t("bodyPhotos")}</span>
        <ImageUploadField
          name="body_photos"
          multiple
          capture="environment"
          required
          removeLabel={t("removePhoto")}
          className="w-full text-sm"
        />
        <span className="mt-1 block text-xs text-foreground/50">{t("bodyPhotosHint")}</span>
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium">{t("customerSignature")}</span>
        <SignaturePad name="signature_data_url" clearLabel={t("clearSignature")} />
        <span className="mt-1 block text-xs text-foreground/50">{t("signatureHint")}</span>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? t("submitting") : type === "delivery" ? t("submitDelivery") : t("submitReturn")}
      </button>
    </form>
  );
}
