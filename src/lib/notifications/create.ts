import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/supabase/types";

export async function createNotification(params: {
  recipientRole: "admin" | "inspector";
  type: NotificationType;
  reservationId?: string;
  message: string;
  link?: string;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("create_notification", {
      p_recipient_role: params.recipientRole,
      p_type: params.type,
      p_reservation_id: params.reservationId ?? null,
      p_message: params.message,
      p_link: params.link ?? null,
    });
    if (error) throw error;
  } catch (err) {
    // Never let a notification failure (e.g. the migration hasn't been run
    // yet) break the reservation/handover flow that triggered it.
    console.error("createNotification failed:", err);
  }
}
