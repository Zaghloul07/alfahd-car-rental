// Egyptian mobile numbers: 01[0125]XXXXXXXX (11 digits, local format).
const EGYPT_MOBILE_PATTERN = /^01[0125][0-9]{8}$/;

export function isValidEgyptPhone(phone: string): boolean {
  return EGYPT_MOBILE_PATTERN.test(phone.trim());
}

// Canonical form used as a stable key: country code + subscriber number,
// digits only (e.g. "201012345678"). Used both for storage and to derive
// the synthetic auth email below.
export function canonicalizePhone(phone: string): string {
  const digits = phone.trim().replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `20${digits.slice(1)}`;
  if (digits.length === 10) return `20${digits}`;
  return digits;
}

// Supabase Auth needs an email/password identity under the hood since we
// aren't using their SMS-based phone auth (no SMS provider configured yet).
// This address is never sent anything — it only exists to give each phone
// number a unique, stable auth identity.
export function phoneToSyntheticEmail(phone: string): string {
  return `${canonicalizePhone(phone)}@customer.elfahdcars.app`;
}
