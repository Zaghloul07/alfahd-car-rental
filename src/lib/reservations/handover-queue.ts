import { createClient } from "@/lib/supabase/server";
import type { ReservationWithCustomer } from "@/lib/reservations";

export async function getReservationsForHandoverQueue(): Promise<ReservationWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, cars(id, title, images), customers(id, name, phone, national_id_front_url, national_id_back_url, driving_license_url)"
    )
    .in("status", ["confirmed", "delivered"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservationWithCustomer[];
}
