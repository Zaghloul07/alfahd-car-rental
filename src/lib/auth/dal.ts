import "server-only";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const getCurrentAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_admin, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;

  return profile;
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (admin) return admin;

  const locale = await getLocale();
  redirect({ href: "/admin/login", locale });
  // `redirect`'s `never` return type isn't resolved under plain `tsc`
  // (no react-server export condition), so narrow explicitly.
  throw new Error("unreachable");
}

export const getCurrentInspectorOrAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_admin, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (!profile.is_admin && profile.role !== "inspector")) return null;

  return profile;
});

export async function requireInspectorOrAdmin() {
  const profile = await getCurrentInspectorOrAdmin();
  if (profile) return profile;

  const locale = await getLocale();
  redirect({ href: "/admin/login", locale });
  throw new Error("unreachable");
}
