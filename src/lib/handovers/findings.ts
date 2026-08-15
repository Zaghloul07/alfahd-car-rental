import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { HandoverDamageFindingRow } from "@/lib/supabase/types";

export async function getDamageFindingsForReservation(
  reservationId: string
): Promise<HandoverDamageFindingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handover_damage_findings")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
