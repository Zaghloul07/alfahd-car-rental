import { createClient } from "@/lib/supabase/server";
import type { CarRow, CustomerRow, ReservationRow } from "@/lib/supabase/types";

export type ReservationWithCar = ReservationRow & { cars: Pick<CarRow, "id" | "title" | "images" | "daily_price" | "monthly_price"> | null };
export type ReservationWithCustomer = ReservationRow & {
  cars: Pick<CarRow, "id" | "title" | "images"> | null;
  customers: Pick<CustomerRow, "id" | "name" | "phone" | "national_id_front_url" | "national_id_back_url" | "driving_license_url"> | null;
};

export async function getReservationsForCustomer(customerId: string): Promise<ReservationWithCar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, cars(id, title, images, daily_price, monthly_price)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservationWithCar[];
}

export async function getAllReservationsForAdmin(): Promise<ReservationWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, cars(id, title, images), customers(id, name, phone, national_id_front_url, national_id_back_url, driving_license_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservationWithCustomer[];
}
