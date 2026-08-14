"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireInspectorOrAdmin } from "@/lib/auth/dal";
import { createNotification } from "@/lib/notifications/create";
import type { HandoverPhotoType, HandoverType } from "@/lib/supabase/types";

const handoverSchema = z.object({
  odometer_km: z.coerce.number().int().min(0),
  fuel_level: z.enum(["empty", "quarter", "half", "three_quarter", "full"]),
  notes: z.string().optional(),
  return_date: z.string().optional(),
});

export type HandoverFormState = { error?: string } | undefined;

function decodeSignature(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid signature.");
  return { buffer: Buffer.from(match[2], "base64"), contentType: match[1] };
}

export async function submitHandover(
  reservationId: string,
  type: HandoverType,
  _state: HandoverFormState,
  formData: FormData
): Promise<HandoverFormState> {
  const admin = await requireInspectorOrAdmin();
  const supabase = await createClient();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", reservationId)
    .single();
  if (reservationError || !reservation) {
    return { error: "Reservation not found." };
  }
  if (type === "delivery" && reservation.status !== "confirmed") {
    return { error: "This reservation must be confirmed before recording delivery." };
  }
  if (type === "return" && reservation.status !== "delivered") {
    return { error: "The car must be delivered before its return can be recorded." };
  }

  const { count: existingCount } = await supabase
    .from("handover_reports")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", reservationId)
    .eq("type", type);
  if (existingCount && existingCount > 0) {
    return { error: "This inspection has already been recorded." };
  }

  let fields: z.infer<typeof handoverSchema>;
  try {
    fields = handoverSchema.parse(Object.fromEntries(formData.entries()));
  } catch {
    return { error: "Enter a valid odometer reading and fuel level." };
  }
  if (type === "return" && !fields.return_date) {
    return { error: "Enter the date the car was returned." };
  }

  const signatureDataUrl = String(formData.get("signature_data_url") ?? "");
  if (!signatureDataUrl) return { error: "The customer's signature is required." };

  const odometerPhoto = formData.get("odometer_photo");
  const fuelPhoto = formData.get("fuel_photo");
  const bodyPhotos = formData
    .getAll("body_photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!(odometerPhoto instanceof File) || !odometerPhoto.size) {
    return { error: "Add a photo of the odometer." };
  }
  if (!(fuelPhoto instanceof File) || !fuelPhoto.size) {
    return { error: "Add a photo of the fuel gauge." };
  }
  if (bodyPhotos.length === 0) {
    return { error: "Add at least one photo of the car body." };
  }

  const handoverId = crypto.randomUUID();

  try {
    const { buffer, contentType } = decodeSignature(signatureDataUrl);
    const { error: signatureError } = await supabase.storage
      .from("handover-photos")
      .upload(`${handoverId}/signature.png`, buffer, { contentType, upsert: true });
    if (signatureError) throw signatureError;

    const photoRows: { photo_type: HandoverPhotoType; storage_path: string }[] = [];

    async function uploadPhoto(file: File, photoType: HandoverPhotoType) {
      const path = `${handoverId}/${photoType}-${crypto.randomUUID()}`;
      const { error } = await supabase.storage.from("handover-photos").upload(path, file);
      if (error) throw error;
      photoRows.push({ photo_type: photoType, storage_path: path });
    }

    await uploadPhoto(odometerPhoto, "odometer");
    await uploadPhoto(fuelPhoto, "fuel");
    await Promise.all(bodyPhotos.map((file) => uploadPhoto(file, "body")));

    const { error: insertError } = await supabase.from("handover_reports").insert({
      id: handoverId,
      reservation_id: reservationId,
      type,
      odometer_km: fields.odometer_km,
      fuel_level: fields.fuel_level,
      notes: fields.notes?.trim() || null,
      return_date: type === "return" ? fields.return_date : null,
      signature_path: `${handoverId}/signature.png`,
      created_by: admin.id,
    });
    if (insertError) throw insertError;

    const { error: photosError } = await supabase
      .from("handover_photos")
      .insert(photoRows.map((p) => ({ handover_id: handoverId, ...p })));
    if (photosError) throw photosError;

    const { error: statusError } = await supabase
      .from("reservations")
      .update({ status: type === "delivery" ? "delivered" : "completed" })
      .eq("id", reservationId);
    if (statusError) throw statusError;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the inspection. Please try again." };
  }

  await createNotification({
    recipientRole: "admin",
    type: type === "delivery" ? "handover_delivered" : "handover_returned",
    reservationId,
    message: type === "delivery" ? "A car was delivered to a customer." : "A car was returned by a customer.",
    link: `/admin/reservations#reservation-${reservationId}`,
  });

  revalidatePath("/", "layout");
}
