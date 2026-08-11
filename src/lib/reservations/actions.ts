"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { requireCustomer, hasSubmittedDocuments } from "@/lib/auth/customer-dal";

export type ReservationFormState = { error?: string } | undefined;

export async function createReservation(
  carId: string,
  _state: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const customer = await requireCustomer();
  const locale = await getLocale();

  if (!hasSubmittedDocuments(customer)) {
    redirect({ href: "/account/documents", locale });
  }

  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!startDate || !endDate) {
    return { error: "Choose a start and end date." };
  }
  if (endDate < startDate) {
    return { error: "End date must be after the start date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reservations").insert({
    car_id: carId,
    customer_id: customer.id,
    start_date: startDate,
    end_date: endDate,
    notes,
    status: "pending",
  });

  if (error) {
    return { error: "Could not submit your reservation. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect({ href: "/account/reservations", locale });
}

export async function reviewReservation(reservationId: string, approve: boolean) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reservations")
    .update({
      status: approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", reservationId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
