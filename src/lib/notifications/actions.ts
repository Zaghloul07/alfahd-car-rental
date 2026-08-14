"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInspectorOrAdmin } from "@/lib/auth/dal";
import { getUnreadCount, getRecentNotifications } from "@/lib/notifications/queries";

export async function getUnreadNotificationCount() {
  const profile = await requireInspectorOrAdmin();
  return getUnreadCount(profile);
}

export async function getRecentNotificationsAction() {
  const profile = await requireInspectorOrAdmin();
  return getRecentNotifications(profile);
}

export async function markNotificationRead(notificationId: string) {
  await requireInspectorOrAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const profile = await requireInspectorOrAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (!profile.is_admin) query = query.eq("recipient_role", profile.role ?? "inspector");

  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
