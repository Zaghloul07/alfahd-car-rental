"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { canonicalizePhone, isValidEgyptPhone, phoneToSyntheticEmail } from "@/lib/phone";

export type AuthFormState = { error?: string } | undefined;

function safeNextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function signupCustomer(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Enter your name." };
  if (!isValidEgyptPhone(phone)) {
    return { error: "Enter a valid Egyptian mobile number (e.g. 01012345678)." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const canonicalPhone = canonicalizePhone(phone);
  const email = phoneToSyntheticEmail(phone);
  const supabase = await createClient();

  const { data: signedUp, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already")) {
      return { error: "This phone number is already registered. Try signing in instead." };
    }
    return { error: "Could not create your account. Please try again." };
  }

  // Supabase returns a fake success without a session when the email is
  // already registered (to avoid leaking which emails exist).
  if (!signedUp.user || !signedUp.session) {
    return { error: "This phone number is already registered. Try signing in instead." };
  }

  const { error: profileError } = await supabase
    .from("customers")
    .insert({ id: signedUp.user.id, name, phone: canonicalPhone });

  if (profileError) {
    return { error: "This phone number is already registered. Try signing in instead." };
  }

  const locale = await getLocale();
  redirect({ href: safeNextPath(formData), locale });
}

export async function loginCustomer(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEgyptPhone(phone)) {
    return { error: "Enter a valid Egyptian mobile number." };
  }

  const email = phoneToSyntheticEmail(phone);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Incorrect phone number or password." };

  const locale = await getLocale();
  redirect({ href: safeNextPath(formData), locale });
}

export async function logoutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/login", locale });
}
