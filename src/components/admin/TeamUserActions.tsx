"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetTeamUserPassword, setTeamUserLocked } from "@/lib/users/actions";

export default function TeamUserActions({
  userId,
  locked,
  isSelf,
}: {
  userId: string;
  locked: boolean;
  isSelf: boolean;
}) {
  const t = useTranslations("AdminUsers");
  const [showReset, setShowReset] = useState(false);
  const [resetState, resetAction, resetPending] = useActionState(
    resetTeamUserPassword.bind(null, userId),
    undefined
  );
  const [lockPending, startLockTransition] = useTransition();
  const resetFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetState?.success) resetFormRef.current?.reset();
  }, [resetState]);

  function handleToggleLock() {
    const message = locked ? t("confirmUnlock") : t("confirmLock");
    if (!confirm(message)) return;
    startLockTransition(() => {
      setTeamUserLocked(userId, !locked);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          onClick={() => setShowReset((v) => !v)}
          className="font-medium text-brand hover:underline"
        >
          {t("resetPassword")}
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={handleToggleLock}
            disabled={lockPending}
            className="font-medium text-red-600 hover:underline disabled:opacity-60"
          >
            {lockPending ? t("saving") : locked ? t("unlock") : t("lock")}
          </button>
        )}
      </div>

      {showReset && (
        <form ref={resetFormRef} action={resetAction} className="mt-1 flex items-center gap-2">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={t("newPassword")}
            className="w-36 rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={resetPending}
            className="whitespace-nowrap rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {resetPending ? t("saving") : t("save")}
          </button>
        </form>
      )}
      {resetState?.error && <p className="text-xs text-red-600">{resetState.error}</p>}
      {resetState?.success && <p className="text-xs text-emerald-600">{t("passwordUpdated")}</p>}
    </div>
  );
}
