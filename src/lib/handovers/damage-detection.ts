import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DamageAngle, HandoverPhotoType, HandoverType } from "@/lib/supabase/types";

const BODY_ANGLES: DamageAngle[] = ["front", "back", "left", "right"];

const PROMPT = (angle: string) =>
  `You are inspecting a rental car for new damage. The first image is the ${angle} of the car ` +
  `taken at delivery (before the rental); the second image is the same ${angle} taken at return ` +
  `(after the rental). Compare them and identify any NEW damage visible in the second image that ` +
  `is not present in the first — scratches, dents, cracks, broken parts, etc. Ignore differences in ` +
  `lighting, angle, dirt, or reflections.\n\n` +
  `For each distinct new damage point you find, provide a short one-sentence description in English, ` +
  `the same description translated into Arabic, and a rough estimated repair cost in Egyptian Pounds ` +
  `(EGP) based on typical repair/paint-shop costs for that kind of damage in Egypt. If there is no new ` +
  `damage, return an empty array.`;

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      descriptionEn: { type: "STRING" },
      descriptionAr: { type: "STRING" },
      estimatedCostEgp: { type: "NUMBER" },
    },
    required: ["descriptionEn", "descriptionAr", "estimatedCostEgp"],
  },
};

type DamageItem = { descriptionEn: string; descriptionAr: string; estimatedCostEgp: number };

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
): Promise<DamageItem[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );
  if (!response.ok) {
    console.error(`Gemini API request failed: ${response.status} ${await response.text()}`);
    return null;
  }

  const json = await response.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error("Gemini returned unparseable JSON:", err, text);
    return null;
  }
}

/**
 * Compares delivery vs. return body photos angle-by-angle via Gemini and
 * stores any new-damage findings (bilingual description + a rough EGP
 * repair-cost estimate). Best-effort: skipped silently if GEMINI_API_KEY
 * isn't set, and a failure on one angle never blocks the others or the
 * caller.
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

        const items = await callGeminiVision(PROMPT(angle), [before, after]);
        if (!items || items.length === 0) return;

        await supabase.from("handover_damage_findings").insert(
          items.map((item) => ({
            reservation_id: reservationId,
            angle,
            finding_en: item.descriptionEn,
            finding_ar: item.descriptionAr,
            estimated_cost_egp: item.estimatedCostEgp,
          }))
        );
      } catch (err) {
        console.error(`detectReturnDamage failed for angle ${angle}:`, err);
      }
    })
  );
}
