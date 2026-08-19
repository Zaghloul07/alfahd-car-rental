"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getUnreadNotificationCountForCustomer,
  getRecentNotificationsForCustomerAction,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "@/lib/notifications/actions";
import type { NotificationRow } from "@/lib/supabase/types";

const POLL_INTERVAL_MS = 30000;

export default function CustomerNotificationBell({ initialCount }: { initialCount: number }) {
  const t = useTranslations("Notifications");
  const [count, setCount] = useState(initialCount);
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const interval = setInterval(() => {
      getUnreadNotificationCountForCustomer()
        .then(setCount)
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      getRecentNotificationsForCustomerAction()
        .then(setNotifications)
        .catch(() => {});
    }
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllCustomerNotificationsRead();
      setCount(0);
      setNotifications((prev) =>
        prev ? prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) : prev
      );
    });
  }

  function handleMarkOne(id: string) {
    startTransition(async () => {
      await markCustomerNotificationRead(id);
      setCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)) : prev
      );
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        {t("bell")}
        {count > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-foreground/70">{t("title")}</span>
            <button
              type="button"
              disabled={pending}
              onClick={handleMarkAll}
              className="text-xs font-medium text-brand hover:underline disabled:opacity-60"
            >
              {t("markAllRead")}
            </button>
          </div>
          {notifications === null ? (
            <p className="px-2 py-4 text-center text-xs text-foreground/50">{t("loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-foreground/50">{t("empty")}</p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg px-2 py-2 text-xs ${
                    n.read_at ? "text-foreground/50" : "bg-brand/5 font-medium"
                  }`}
                >
                  <Link
                    href={n.link ?? "/account/reservations"}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read_at) handleMarkOne(n.id);
                    }}
                    className="block w-full text-start"
                  >
                    {n.message}
                    <span className="mt-0.5 block text-[10px] text-foreground/40">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
