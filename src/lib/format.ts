export function formatEGP(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(km: number | null | undefined) {
  if (km == null) return "—";
  return `${new Intl.NumberFormat("en-EG").format(km)} km`;
}
