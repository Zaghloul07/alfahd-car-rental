"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReservationFormState } from "@/lib/reservations/actions";

type ReserveAction = (
  state: ReservationFormState,
  formData: FormData
) => Promise<ReservationFormState>;

type DateRange = { start_date: string; end_date: string };

type Props =
  | { status: "signed_out"; nextPath: string; blockedRanges: DateRange[] }
  | {
      status: "ready";
      action: ReserveAction;
      blockedRanges: DateRange[];
      defaultStart?: string;
      defaultEnd?: string;
    };

function overlapsBlocked(start: string, end: string, ranges: DateRange[]) {
  return ranges.some((r) => start <= r.end_date && end >= r.start_date);
}

function BlockedRanges({ ranges }: { ranges: DateRange[] }) {
  const t = useTranslations("Reservation");
  if (ranges.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-foreground/60">
      {t("unavailableDates")}:{" "}
      {ranges.map((r, i) => (
        <span key={i}>
          {r.start_date} → {r.end_date}
          {i < ranges.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}

export default function ReservationPanel(props: Props) {
  const t = useTranslations("Reservation");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  if (props.status === "signed_out") {
    const query = new URLSearchParams();
    if (start) query.set("start", start);
    if (end) query.set("end", end);
    const next = `${props.nextPath}${query.toString() ? `?${query.toString()}` : ""}`;

    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">{t("checkAvailabilityTitle")}</p>
        <p className="mt-1 text-sm text-foreground/60">{t("checkAvailabilitySubtitle")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground/70">{t("from")}</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground/70">{t("to")}</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>
        <BlockedRanges ranges={props.blockedRanges} />
        <div className="mt-3 flex gap-3">
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            {t("signUpToReserve")}
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="rounded-lg border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReservationForm
      action={props.action}
      blockedRanges={props.blockedRanges}
      defaultStart={props.defaultStart}
      defaultEnd={props.defaultEnd}
    />
  );
}

function ReservationForm({
  action,
  blockedRanges,
  defaultStart,
  defaultEnd,
}: {
  action: ReserveAction;
  blockedRanges: DateRange[];
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const t = useTranslations("Reservation");
  const [state, formAction, pending] = useActionState(action, undefined);
  const [start, setStart] = useState(defaultStart ?? "");
  const [end, setEnd] = useState(defaultEnd ?? "");

  const conflict = useMemo(
    () => Boolean(start && end && overlapsBlocked(start, end, blockedRanges)),
    [start, end, blockedRanges]
  );

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">{t("formTitle")}</p>
      <p className="text-xs text-foreground/60">{t("formSubtitle")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("from")}</span>
          <input
            name="start_date"
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground/70">{t("to")}</span>
          <input
            name="end_date"
            type="date"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>
      <BlockedRanges ranges={blockedRanges} />
      {conflict && <p className="text-sm text-red-600">{t("datesUnavailable")}</p>}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground/70">{t("notes")}</span>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || conflict}
        className="w-full rounded-lg bg-accent py-2.5 font-semibold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
