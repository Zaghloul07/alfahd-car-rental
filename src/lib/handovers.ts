import { createClient } from "@/lib/supabase/server";
import type { HandoverPhotoRow, HandoverReportRow } from "@/lib/supabase/types";

export type HandoverWithPhotos = HandoverReportRow & { handover_photos: HandoverPhotoRow[] };

export async function getHandoversForReservation(reservationId: string): Promise<HandoverWithPhotos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handover_reports")
    .select("*, handover_photos(*)")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as HandoverWithPhotos[];
}
