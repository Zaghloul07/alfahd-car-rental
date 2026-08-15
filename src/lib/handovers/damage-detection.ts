import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DamageAngle, HandoverPhotoType, HandoverType } from "@/lib/supabase/types";

const BODY_ANGLES: DamageAngle[] = ["front", "back", "left", "right"];
const NO_DAMAGE_MARKER = "NO NEW DAMAGE";

const PROMPT = (angle: string) =>
  `You are inspecting a rental car for new damage. The first image is the ${angle} of the car ` +
  `taken at delivery (before the rental); the second image is the same ${angle} taken at return ` +
  `(after the rental). Compare them and identify any NEW damage visible in the second image that ` +
  `is not present in the first — scratches, dents, cracks, broken parts, etc. Ignore differences in ` +
  `lighting, angle, dirt, or reflections. If there is no new damage, respond with exactly ` +
  `"${NO_DAMAGE_MARKER}" and nothing else. Otherwise, briefly list each new damage point in one ` +
  `short sentence each, no preamble.`;

async function fetchImageAsBase64(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string
): Promise<{ data: string; mimeType: string } | null> {
  const { data, error } = await supabase.storage.from("handover-photos").download(path);
  if (error || !data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType: data.type || "image/jpeg" };
}

async function callGeminiVision(
  prompt: string,
  images: { data: string; mimeType: string }[]
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.data } })),
            ],
          },
        ],
      }),
    }
  );
  if (!response.ok) return null;

  const json = await response.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

/**
 * Compares delivery vs. return body photos angle-by-angle via Gemini and
 * stores any new-damage descriptions. Best-effort: skipped silently if
 * GEMINI_API_KEY isn't set, and a failure on one angle never blocks the
 * others or the caller.
 */
export async function detectReturnDamage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reservationId: string
): Promise<void> {
  if (!process.env.GEMINI_API_KEY) return;

  const { data } = await supabase
    .from("handover_reports")
    .select("id, type, handover_photos(photo_type, storage_path)")
    .eq("reservation_id", reservationId)
    .in("type", ["delivery", "return"]);
  const reports = data as unknown as
    | { id: string; type: HandoverType; handover_photos: { photo_type: HandoverPhotoType; storage_path: string }[] }[]
    | null;
  if (!reports) return;

  const delivery = reports.find((r) => r.type === "delivery");
  const ret = reports.find((r) => r.type === "return");
  if (!delivery || !ret) return;

  const photoFor = (
    report: { handover_photos: { photo_type: HandoverPhotoType; storage_path: string }[] },
    angle: DamageAngle
  ) => report.handover_photos.find((p) => p.photo_type === `body_${angle}`)?.storage_path ?? null;

  await Promise.all(
    BODY_ANGLES.map(async (angle) => {
      try {
        const beforePath = photoFor(delivery, angle);
        const afterPath = photoFor(ret, angle);
        if (!beforePath || !afterPath) return;

        const [before, after] = await Promise.all([
          fetchImageAsBase64(supabase, beforePath),
          fetchImageAsBase64(supabase, afterPath),
        ]);
        if (!before || !after) return;

        const finding = await callGeminiVision(PROMPT(angle), [before, after]);
        if (!finding || finding.toUpperCase().includes(NO_DAMAGE_MARKER)) return;

        await supabase.from("handover_damage_findings").insert({
          reservation_id: reservationId,
          angle,
          finding,
        });
      } catch (err) {
        console.error(`detectReturnDamage failed for angle ${angle}:`, err);
      }
    })
  );
}
