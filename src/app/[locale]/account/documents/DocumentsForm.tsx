"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { uploadDocuments } from "@/lib/customers/actions";

export default function DocumentsForm({
  hasFront,
  hasBack,
  hasLicense,
}: {
  hasFront: boolean;
  hasBack: boolean;
  hasLicense: boolean;
}) {
  const t = useTranslations("Documents");
  const [state, formAction, pending] = useActionState(uploadDocuments, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <FileField name="national_id_front" label={t("idFront")} alreadyUploaded={hasFront} />
      <FileField name="national_id_back" label={t("idBack")} alreadyUploaded={hasBack} />
      <FileField name="driving_license" label={t("license")} alreadyUploaded={hasLicense} />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function FileField({
  name,
  label,
  alreadyUploaded,
}: {
  name: string;
  label: string;
  alreadyUploaded: boolean;
}) {
  const t = useTranslations("Documents");

  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-medium">
        {label}
        {alreadyUploaded && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {t("uploaded")}
          </span>
        )}
      </span>
      <input
        name={name}
        type="file"
        accept="image/*"
        required={!alreadyUploaded}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
