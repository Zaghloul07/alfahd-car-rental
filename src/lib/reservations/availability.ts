import "server-only";
import { createClient } from "@/lib/supabase/server";

export const BLOCKING_RESERVATION_STATUSES = ["approved", "confirmed", "delivered"] as const;

export type DateRange = { start_date: string; end_date: string };

type AvailabilityRow = { reservation_id: string; car_id: string; start_date: string; end_date: string };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && aEnd >= bStart;
}

async function getAllBlockingRanges(): Promise<AvailabilityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_car_availability");
  if (error) throw error;
  return data ?? [];
}

export async function isCarAvailable(
  carId: string,
  startDate: string,
  endDate: string,
  excludeReservationId?: string
): Promise<boolean> {
  const ranges = await getAllBlockingRanges();
  return !ranges.some(
    (r) =>
      r.car_id === carId &&
      r.reservation_id !== excludeReservationId &&
      rangesOverlap(startDate, endDate, r.start_date, r.end_date)
  );
}

export async function getUnavailableDateRanges(carId: string): Promise<DateRange[]> {
  const ranges = await getAllBlockingRanges();
  return ranges
    .filter((r) => r.car_id === carId)
    .map((r) => ({ start_date: r.start_date, end_date: r.end_date }));
}

export async function getBlockedCarIds(startDate: string, endDate: string): Promise<string[]> {
  const ranges = await getAllBlockingRanges();
  const ids = ranges
    .filter((r) => rangesOverlap(startDate, endDate, r.start_date, r.end_date))
    .map((r) => r.car_id);
  return Array.from(new Set(ids));
}
