"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginCustomer } from "@/lib/auth/customer-actions";

export default function LoginForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(loginCustomer, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
    >
      <input type="hidden" name="next" value={next} />
      <h1 className="text-xl font-bold text-brand">{t("loginTitle")}</h1>
      <p className="mt-1 text-sm text-foreground/60">{t("loginSubtitle")}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            {t("mobileNumber")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="01012345678"
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

      <p className="mt-4 text-center text-sm text-foreground/60">
        {t("newHere")}{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
