"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInspectorOrAdmin } from "@/lib/auth/dal";
import { requireCustomer } from "@/lib/auth/customer-dal";
import {
  getUnreadCount,
  getRecentNotifications,
  getUnreadCountForCustomer,
  getRecentNotificationsForCustomer,
} from "@/lib/notifications/queries";

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
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .eq("recipient_role", profile.is_admin ? "admin" : (profile.role ?? "inspector"));

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function getUnreadNotificationCountForCustomer() {
  const customer = await requireCustomer();
  return getUnreadCountForCustomer(customer.id);
}

export async function getRecentNotificationsForCustomerAction() {
  const customer = await requireCustomer();
  return getRecentNotificationsForCustomer(customer.id);
}

export async function markCustomerNotificationRead(notificationId: string) {
  const customer = await requireCustomer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("customer_id", customer.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function markAllCustomerNotificationsRead() {
  const customer = await requireCustomer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .eq("customer_id", customer.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
