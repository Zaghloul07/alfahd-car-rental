import { createClient } from "@/lib/supabase/server";
import type { CarRow, ListingType } from "@/lib/supabase/types";

export interface CarFilters {
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
}

export async function getPublishedCars(
  listingType: ListingType,
  filters: CarFilters = {}
): Promise<CarRow[]> {
  const supabase = await createClient();
  const priceColumn = listingType === "rent" ? "daily_price" : "sale_price";

  let query = supabase
    .from("cars")
    .select("*")
    .eq("listing_type", listingType)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (filters.make) query = query.eq("make", filters.make);
  if (filters.minYear) query = query.gte("year", filters.minYear);
  if (filters.maxYear) query = query.lte("year", filters.maxYear);
  if (filters.minPrice) query = query.gte(priceColumn, filters.minPrice);
  if (filters.maxPrice) query = query.lte(priceColumn, filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCarById(id: string): Promise<CarRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cars").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllCarsForAdmin(): Promise<CarRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAvailableMakes(listingType: ListingType): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("make")
    .eq("listing_type", listingType)
    .eq("status", "published");
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.make))).sort();
}
