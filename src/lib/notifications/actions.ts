"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaffOrAdmin } from "@/lib/auth/dal";
import { getUnreadCount, getRecentNotifications } from "@/lib/notifications/queries";

export async function getUnreadNotificationCount() {
  const profile = await requireStaffOrAdmin();
  return getUnreadCount(profile);
}

export async function getRecentNotificationsAction() {
  const profile = await requireStaffOrAdmin();
  return getRecentNotifications(profile);
}

export async function markNotificationRead(notificationId: string) {
  await requireStaffOrAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const profile = await requireStaffOrAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (!profile.is_admin) query = query.eq("recipient_role", profile.role ?? "staff");

  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
