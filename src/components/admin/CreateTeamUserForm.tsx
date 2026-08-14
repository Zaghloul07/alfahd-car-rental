"use client";

import { useActionState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createTeamUser } from "@/lib/users/actions";

export default function CreateTeamUserForm() {
  const t = useTranslations("AdminUsers");
  const [state, formAction, pending] = useActionState(createTeamUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <p className="text-sm font-medium">{t("addTitle")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("password")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("role")}</span>
          <select
            name="role"
            required
            defaultValue=""
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              {t("selectRole")}
            </option>
            <option value="admin">{t("admin")}</option>
            <option value="inspector">{t("inspector")}</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? t("creating") : t("create")}
        </button>
      </div>
      <p className="text-xs text-foreground/50">{t("passwordHint")}</p>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t("createdSuccess")}</p>}
    </form>
  );
}
