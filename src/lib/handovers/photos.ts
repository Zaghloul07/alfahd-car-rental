import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FuelLevel, HandoverPhotoType, HandoverType } from "@/lib/supabase/types";
import type { HandoverWithPhotos } from "@/lib/handovers";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function getSignedHandoverUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("handover-photos")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

export type ResolvedHandover = {
  type: HandoverType;
  odometer_km: number;
  fuel_level: FuelLevel;
  notes: string | null;
  created_at: string;
  signatureUrl: string | null;
  photos: { photo_type: HandoverPhotoType; url: string | null }[];
};

export async function resolveHandoverForDisplay(handover: HandoverWithPhotos): Promise<ResolvedHandover> {
  const [signatureUrl, photos] = await Promise.all([
    getSignedHandoverUrl(handover.signature_path),
    Promise.all(
      handover.handover_photos.map(async (p) => ({
        photo_type: p.photo_type,
        url: await getSignedHandoverUrl(p.storage_path),
      }))
    ),
  ]);

  return {
    type: handover.type,
    odometer_km: handover.odometer_km,
    fuel_level: handover.fuel_level,
    notes: handover.notes,
    created_at: handover.created_at,
    signatureUrl,
    photos,
  };
}
