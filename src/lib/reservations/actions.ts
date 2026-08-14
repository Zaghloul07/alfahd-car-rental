"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { requireCustomer } from "@/lib/auth/customer-dal";
import { isCarAvailable } from "@/lib/reservations/availability";
import { createNotification } from "@/lib/notifications/create";

export type ReservationFormState = { error?: string } | undefined;

export async function createReservation(
  carId: string,
  _state: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const customer = await requireCustomer();

  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!startDate || !endDate) {
    return { error: "Choose a start and end date." };
  }
  if (endDate < startDate) {
    return { error: "End date must be after the start date." };
  }

  const available = await isCarAvailable(carId, startDate, endDate);
  if (!available) {
    return { error: "This car is not available for the selected dates." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("reservations")
    .insert({
      car_id: carId,
      customer_id: customer.id,
      start_date: startDate,
      end_date: endDate,
      notes,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Could not submit your reservation. Please try again." };
  }

  await createNotification({
    recipientRole: "admin",
    type: "reservation_created",
    reservationId: inserted.id,
    message: `New reservation request from ${customer.name}.`,
    link: "/admin/reservations",
  });

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/account/reservations", locale });
}

export async function reviewReservation(reservationId: string, approve: boolean) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  if (approve) {
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("car_id, start_date, end_date")
      .eq("id", reservationId)
      .single();
    if (fetchError || !reservation) throw new Error("Reservation not found.");
    if (reservation.start_date && reservation.end_date) {
      const available = await isCarAvailable(
        reservation.car_id,
        reservation.start_date,
        reservation.end_date,
        reservationId
      );
      if (!available) {
        throw new Error("These dates are no longer available for this car.");
      }
    }
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      status: approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", reservationId);

  if (error) throw new Error(error.message);

  await createNotification({
    recipientRole: "admin",
    type: approve ? "reservation_approved" : "reservation_rejected",
    reservationId,
    message: approve ? "A reservation was approved." : "A reservation was rejected.",
    link: "/admin/reservations",
  });

  revalidatePath("/", "layout");
}
