import "server-only";
import { cache } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const getCurrentCustomer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return customer;
});

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (customer) return customer;

  const locale = await getLocale();
  redirect({ href: "/login", locale });
  // `redirect`'s `never` return type isn't resolved under plain `tsc`
  // (no react-server export condition), so narrow explicitly.
  throw new Error("unreachable");
}

export function hasSubmittedDocuments(customer: {
  national_id_front_url: string | null;
  national_id_back_url: string | null;
  driving_license_url: string | null;
}) {
  return Boolean(
    customer.national_id_front_url && customer.national_id_back_url && customer.driving_license_url
  );
}
