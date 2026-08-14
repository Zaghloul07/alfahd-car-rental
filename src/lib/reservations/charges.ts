import { createClient } from "@/lib/supabase/server";
import type { ReservationChargeRow } from "@/lib/supabase/types";

export async function getChargesForReservation(reservationId: string): Promise<ReservationChargeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservation_charges")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
