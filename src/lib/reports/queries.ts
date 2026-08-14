import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OverviewStats = {
  activeReservations: number;
  pendingApprovals: number;
  upcomingDeliveries: number;
  revenueThisMonth: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activeReservations, pendingApprovals, upcomingDeliveries, paidThisMonth] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "confirmed", "delivered"]),
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("reservations").select("amount_paid").gte("paid_at", startOfMonth.toISOString()),
  ]);

  const revenueThisMonth = (paidThisMonth.data ?? []).reduce((sum, r) => sum + (r.amount_paid ?? 0), 0);

  return {
    activeReservations: activeReservations.count ?? 0,
    pendingApprovals: pendingApprovals.count ?? 0,
    upcomingDeliveries: upcomingDeliveries.count ?? 0,
    revenueThisMonth,
  };
}

export type StatusBreakdown = { status: string; count: number };

const STATUS_ORDER = ["pending", "approved", "confirmed", "rejected", "cancelled", "delivered", "completed"];

export async function getReservationsByStatus(): Promise<StatusBreakdown[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reservations").select("status");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

export type MonthlyRevenue = { month: string; revenue: number };

export async function getRevenueByMonth(monthsBack = 6): Promise<MonthlyRevenue[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - (monthsBack - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("reservations")
    .select("amount_paid, paid_at")
    .not("paid_at", "is", null)
    .gte("paid_at", since.toISOString());
  if (error) throw error;

  const buckets = new Map<string, number>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    buckets.set(monthKey(d), 0);
  }
  for (const row of data ?? []) {
    if (!row.paid_at) continue;
    const key = monthKey(new Date(row.paid_at));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (row.amount_paid ?? 0));
  }
  return Array.from(buckets.entries()).map(([month, revenue]) => ({ month, revenue }));
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type CarReportRow = {
  carId: string;
  title: string;
  reservationCount: number;
  revenue: number;
  finesTotal: number;
};

export async function getCarReport(): Promise<CarReportRow[]> {
  const supabase = await createClient();
  const [{ data: cars, error: carsError }, { data: reservations, error: resError }, { data: charges, error: chargesError }] =
    await Promise.all([
      supabase.from("cars").select("id, title"),
      supabase.from("reservations").select("id, car_id, amount_paid"),
      supabase.from("reservation_charges").select("reservation_id, amount"),
    ]);
  if (carsError) throw carsError;
  if (resError) throw resError;
  if (chargesError) throw chargesError;

  const chargesByReservation = new Map<string, number>();
  for (const c of charges ?? []) {
    chargesByReservation.set(c.reservation_id, (chargesByReservation.get(c.reservation_id) ?? 0) + c.amount);
  }

  return (cars ?? [])
    .map((car) => {
      const carReservations = (reservations ?? []).filter((r) => r.car_id === car.id);
      const revenue = carReservations.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0);
      const finesTotal = carReservations.reduce((sum, r) => sum + (chargesByReservation.get(r.id) ?? 0), 0);
      return { carId: car.id, title: car.title, reservationCount: carReservations.length, revenue, finesTotal };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export type CustomerReportRow = {
  customerId: string;
  name: string;
  phone: string;
  reservationCount: number;
  totalPaid: number;
  finesTotal: number;
};

export async function getCustomerReport(): Promise<CustomerReportRow[]> {
  const supabase = await createClient();
  const [
    { data: customers, error: customersError },
    { data: reservations, error: resError },
    { data: charges, error: chargesError },
  ] = await Promise.all([
    supabase.from("customers").select("id, name, phone"),
    supabase.from("reservations").select("id, customer_id, amount_paid"),
    supabase.from("reservation_charges").select("reservation_id, amount"),
  ]);
  if (customersError) throw customersError;
  if (resError) throw resError;
  if (chargesError) throw chargesError;

  const chargesByReservation = new Map<string, number>();
  for (const c of charges ?? []) {
    chargesByReservation.set(c.reservation_id, (chargesByReservation.get(c.reservation_id) ?? 0) + c.amount);
  }

  return (customers ?? [])
    .map((customer) => {
      const customerReservations = (reservations ?? []).filter((r) => r.customer_id === customer.id);
      const totalPaid = customerReservations.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0);
      const finesTotal = customerReservations.reduce((sum, r) => sum + (chargesByReservation.get(r.id) ?? 0), 0);
      return {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        reservationCount: customerReservations.length,
        totalPaid,
        finesTotal,
      };
    })
    .sort((a, b) => b.totalPaid - a.totalPaid);
}
