"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCustomer } from "@/lib/auth/customer-dal";

export type DocumentsFormState = { error?: string } | undefined;

async function uploadOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  field: string,
  file: FormDataEntryValue | null
): Promise<string | undefined> {
  if (!(file instanceof File) || !file.size) return undefined;
  const path = `${customerId}/${field}-${crypto.randomUUID()}`;
  const { error } = await supabase.storage.from("customer-documents").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function uploadDocuments(
  _state: DocumentsFormState,
  formData: FormData
): Promise<DocumentsFormState> {
  const customer = await requireCustomer();
  const supabase = await createClient();

  try {
    const [frontPath, backPath, licensePath] = await Promise.all([
      uploadOne(supabase, customer.id, "national-id-front", formData.get("national_id_front")),
      uploadOne(supabase, customer.id, "national-id-back", formData.get("national_id_back")),
      uploadOne(supabase, customer.id, "driving-license", formData.get("driving_license")),
    ]);

    const update: Record<string, string> = {};
    if (frontPath) update.national_id_front_url = frontPath;
    if (backPath) update.national_id_back_url = backPath;
    if (licensePath) update.driving_license_url = licensePath;

    const willBeComplete =
      (frontPath ?? customer.national_id_front_url) &&
      (backPath ?? customer.national_id_back_url) &&
      (licensePath ?? customer.driving_license_url);

    const { error } = await supabase
      .from("customers")
      .update({
        ...update,
        ...(willBeComplete ? { documents_submitted_at: new Date().toISOString() } : {}),
      })
      .eq("id", customer.id);

    if (error) throw error;
  } catch {
    return { error: "Could not upload your documents. Please try again." };
  }

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/account", locale });
}
