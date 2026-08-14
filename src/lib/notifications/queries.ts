import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/supabase/types";

type Recipient = { is_admin: boolean; role: "admin" | "staff" | null };

export async function getUnreadCount(profile: Recipient): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (!profile.is_admin) query = query.eq("recipient_role", profile.role ?? "staff");

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getRecentNotifications(profile: Recipient, limit = 20): Promise<NotificationRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!profile.is_admin) query = query.eq("recipient_role", profile.role ?? "staff");

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
