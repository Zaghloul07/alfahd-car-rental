"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { hasSubmittedDocuments } from "@/lib/auth/customer-dal";
import { isCarAvailable } from "@/lib/reservations/availability";
import { createNotification } from "@/lib/notifications/create";

export type ConfirmActionState = { error?: string } | undefined;

const paidSchema = z.object({
  amount: z.coerce.number().positive(),
});

export async function markReservationPaid(
  reservationId: string,
  _state: ConfirmActionState,
  formData: FormData
): Promise<ConfirmActionState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", reservationId)
    .single();
  if (fetchError || !reservation) return { error: "Reservation not found." };
  if (reservation.status !== "approved") {
    return { error: "Only approved reservations can be marked as paid." };
  }

  let fields: z.infer<typeof paidSchema>;
  try {
    fields = paidSchema.parse({ amount: formData.get("amount") });
  } catch {
    return { error: "Enter a valid payment amount." };
  }

  const { error } = await supabase
    .from("reservations")
    .update({ amount_paid: fields.amount, paid_at: new Date().toISOString(), paid_by: admin.id })
    .eq("id", reservationId);
  if (error) return { error: "Could not record the payment. Please try again." };

  await createNotification({
    recipientRole: "admin",
    type: "payment_marked_paid",
    reservationId,
    message: "Payment was recorded for a reservation.",
    link: `/admin/reservations#reservation-${reservationId}`,
  });

  revalidatePath("/", "layout");
}

export async function confirmReservation(reservationId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("status, car_id, customer_id, start_date, end_date, amount_paid, paid_at")
    .eq("id", reservationId)
    .single();
  if (fetchError || !reservation) throw new Error("Reservation not found.");
  if (reservation.status !== "approved") {
    throw new Error("Only approved reservations can be confirmed.");
  }
  if (!reservation.paid_at || reservation.amount_paid <= 0) {
    throw new Error("Payment must be recorded before confirming.");
  }
  if (!reservation.start_date || !reservation.end_date) {
    throw new Error("Reservation is missing dates.");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("national_id_front_url, national_id_back_url, driving_license_url")
    .eq("id", reservation.customer_id)
    .single();
  if (customerError || !customer || !hasSubmittedDocuments(customer)) {
    throw new Error("The customer must upload their documents before confirming.");
  }

  const available = await isCarAvailable(
    reservation.car_id,
    reservation.start_date,
    reservation.end_date,
    reservationId
  );
  if (!available) {
    throw new Error("These dates are no longer available for this car.");
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: admin.id })
    .eq("id", reservationId);
  if (error) throw new Error(error.message);

  await createNotification({
    recipientRole: "inspector",
    type: "reservation_confirmed",
    reservationId,
    message: "A reservation is confirmed and ready for delivery.",
    link: `/admin/handovers#reservation-${reservationId}`,
  });

  revalidatePath("/", "layout");
}

export async function cancelReservation(reservationId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", reservationId)
    .single();
  if (fetchError || !reservation) throw new Error("Reservation not found.");
  if (!["pending", "approved", "confirmed"].includes(reservation.status)) {
    throw new Error("This reservation can no longer be cancelled.");
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);
  if (error) throw new Error(error.message);

  await createNotification({
    recipientRole: "admin",
    type: "reservation_cancelled",
    reservationId,
    message: "A reservation was cancelled.",
    link: `/admin/reservations#reservation-${reservationId}`,
  });

  revalidatePath("/", "layout");
}
