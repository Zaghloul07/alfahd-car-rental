"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { createNotification } from "@/lib/notifications/create";

export type ChargeActionState = { error?: string } | undefined;

const chargeSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().min(1),
});

export async function addReservationCharge(
  reservationId: string,
  _state: ChargeActionState,
  formData: FormData
): Promise<ChargeActionState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", reservationId)
    .single();
  if (fetchError || !reservation) return { error: "Reservation not found." };
  if (reservation.status !== "completed") {
    return { error: "Charges can only be added after the car has been returned." };
  }

  let fields: z.infer<typeof chargeSchema>;
  try {
    fields = chargeSchema.parse({
      amount: formData.get("amount"),
      reason: String(formData.get("reason") ?? "").trim(),
    });
  } catch {
    return { error: "Enter a valid amount and reason." };
  }

  const { error } = await supabase.from("reservation_charges").insert({
    reservation_id: reservationId,
    amount: fields.amount,
    reason: fields.reason,
    created_by: admin.id,
  });
  if (error) return { error: "Could not save the charge. Please try again." };

  await createNotification({
    recipientRole: "admin",
    type: "fine_added",
    reservationId,
    message: `A charge of ${fields.amount} EGP was added to a completed reservation.`,
    link: "/admin/reservations",
  });

  revalidatePath("/", "layout");
}
