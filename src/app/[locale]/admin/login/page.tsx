"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login } from "@/lib/auth/actions";

export default function AdminLoginPage() {
  const t = useTranslations("AdminLogin");
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-brand">{t("title")}</h1>
        <p className="mt-1 text-sm text-foreground/60">{t("subtitle")}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        {state?.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>
    </main>
  );
}
