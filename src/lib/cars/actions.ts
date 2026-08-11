"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import type { CarRow } from "@/lib/supabase/types";

const carSchema = z.object({
  listing_type: z.enum(["rent", "sale"]),
  status: z.enum(["draft", "published", "sold", "rented"]),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1980).max(2100),
  title: z.string().min(1),
  description: z.string().optional(),
  mileage_km: z.coerce.number().int().min(0).optional(),
  transmission: z.enum(["automatic", "manual"]).optional(),
  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
  category: z.string().optional(),
  location: z.string().min(1),
  sale_price: z.coerce.number().min(0).optional(),
  price_negotiable: z.coerce.boolean().optional(),
  installment_available: z.coerce.boolean().optional(),
  inspected: z.coerce.boolean().optional(),
  rent_term: z.enum(["short_term", "long_term"]).optional(),
  daily_price: z.coerce.number().min(0).optional(),
  monthly_price: z.coerce.number().min(0).optional(),
});

export type CarFormState = { error?: string } | undefined;

async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const supabase = await createClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!file.size) continue;
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

function parseCarForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return carSchema.parse({
    ...raw,
    price_negotiable: formData.get("price_negotiable") === "on",
    installment_available: formData.get("installment_available") === "on",
    inspected: formData.get("inspected") === "on",
  });
}

export async function createCar(_state: CarFormState, formData: FormData): Promise<CarFormState> {
  await requireAdmin();

  try {
    const fields = parseCarForm(formData);
    const newFiles = formData.getAll("images").filter((f): f is File => f instanceof File);
    const images = await uploadImages(newFiles);

    const supabase = await createClient();
    const { error } = await supabase.from("cars").insert({ ...fields, images });
    if (error) throw error;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the listing." };
  }

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/admin", locale });
}

export async function updateCar(
  id: string,
  _state: CarFormState,
  formData: FormData
): Promise<CarFormState> {
  await requireAdmin();

  try {
    const fields = parseCarForm(formData);
    const newFiles = formData.getAll("images").filter((f): f is File => f instanceof File);
    const newImages = await uploadImages(newFiles);
    const existingImages = JSON.parse(String(formData.get("existing_images") ?? "[]")) as string[];
    const images = [...existingImages, ...newImages];

    const supabase = await createClient();
    const { error } = await supabase.from("cars").update({ ...fields, images }).eq("id", id);
    if (error) throw error;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the listing." };
  }

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/admin", locale });
}

export async function deleteCar(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export type { CarRow };
