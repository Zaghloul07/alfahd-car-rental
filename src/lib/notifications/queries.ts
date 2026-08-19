import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/supabase/types";

type Recipient = { is_admin: boolean; role: "admin" | "inspector" | null };

function roleFor(profile: Recipient) {
  return profile.is_admin ? "admin" : (profile.role ?? "inspector");
}

export async function getUnreadCount(profile: Recipient): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .eq("recipient_role", roleFor(profile));

  if (error) throw error;
  return count ?? 0;
}

export async function getRecentNotifications(profile: Recipient, limit = 20): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_role", roleFor(profile))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCountForCustomer(customerId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .eq("customer_id", customerId);

  if (error) throw error;
  return count ?? 0;
}

export async function getRecentNotificationsForCustomer(
  customerId: string,
  limit = 20
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
