import { getTranslations } from "next-intl/server";
import { formatEGP } from "@/lib/format";
import type { ReservationChargeRow } from "@/lib/supabase/types";

export default async function ChargesList({ charges }: { charges: ReservationChargeRow[] }) {
  if (charges.length === 0) return null;
  const t = await getTranslations("Charges");
  const total = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-sm font-medium">{t("chargesTitle")}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {charges.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4">
            <span className="text-foreground/70">{c.reason}</span>
            <span className="font-medium">{formatEGP(c.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
        <span>{t("total")}</span>
        <span>{formatEGP(total)}</span>
      </div>
    </div>
  );
}
