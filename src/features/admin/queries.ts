import { createClient } from "@/lib/supabase/server";
import type {
  Complex,
  Court,
  DashboardStats,
  MatchDetails,
} from "@/lib/supabase/database.types";

export async function listComplexes(): Promise<Complex[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complexes")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Complex[];
}

export async function getComplex(id: string): Promise<Complex | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("complexes").select("*").eq("id", id).maybeSingle();
  return (data as Complex | null) ?? null;
}

export type CourtWithComplex = Court & { complex_name: string };

export async function listCourts(complexId?: string): Promise<CourtWithComplex[]> {
  const supabase = await createClient();
  let query = supabase.from("courts").select("*").order("name", { ascending: true });
  if (complexId) query = query.eq("complex_id", complexId);

  const { data, error } = await query;
  if (error) throw error;
  const courts = (data ?? []) as Court[];

  const complexes = await listComplexes();
  const nameById = new Map(complexes.map((c) => [c.id, c.name]));

  return courts.map((c) => ({ ...c, complex_name: nameById.get(c.complex_id) ?? "" }));
}

export async function getCourt(id: string): Promise<Court | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("courts").select("*").eq("id", id).maybeSingle();
  return (data as Court | null) ?? null;
}

export async function listCourtsForComplex(complexId: string): Promise<Court[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("complex_id", complexId)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Court[];
}

export interface AdminMatchFilters {
  status?: string;
  complexId?: string;
  scope?: "upcoming" | "past" | "all";
}

export async function listAdminMatches(filters: AdminMatchFilters = {}): Promise<MatchDetails[]> {
  const supabase = await createClient();
  let query = supabase.from("match_details").select("*").order("starts_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.complexId) query = query.eq("complex_id", filters.complexId);
  if (filters.scope === "upcoming") query = query.gte("starts_at", new Date().toISOString());
  if (filters.scope === "past") query = query.lt("starts_at", new Date().toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MatchDetails[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as DashboardStats;
}
