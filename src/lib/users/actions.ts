"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateTeamUserState = { error?: string; success?: boolean } | undefined;

export async function createTeamUser(
  _state: CreateTeamUserState,
  formData: FormData
): Promise<CreateTeamUserState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!email) return { error: "Enter an email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (role !== "admin" && role !== "inspector") return { error: "Choose a role." };

  const adminClient = createAdminClient();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create the account." };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ is_admin: role === "admin", role })
    .eq("id", created.user.id);
  if (profileError) {
    return { error: "Account created but role assignment failed. Set it manually in Supabase." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
