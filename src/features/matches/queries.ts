import { createClient } from "@/lib/supabase/server";
import type {
  MatchDetails,
  PlayerHistoryRow,
  Profile,
  Registration,
} from "@/lib/supabase/database.types";

export interface MatchFilters {
  city?: string;
  complexId?: string;
  date?: string; // YYYY-MM-DD (hora AR)
  onlyAvailable?: boolean;
  includePast?: boolean;
}

/** Listado de partidos para jugadores. */
export async function listMatches(filters: MatchFilters = {}): Promise<MatchDetails[]> {
  const supabase = await createClient();
  let query = supabase
    .from("match_details")
    .select("*")
    .order("starts_at", { ascending: true });

  if (!filters.includePast) {
    query = query.gte("starts_at", new Date().toISOString());
    query = query.in("status", ["open", "full"]);
  }
  if (filters.city) query = query.eq("complex_city", filters.city);
  if (filters.complexId) query = query.eq("complex_id", filters.complexId);
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00-03:00`);
    const end = new Date(`${filters.date}T23:59:59-03:00`);
    query = query.gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as MatchDetails[];
  return filters.onlyAvailable ? rows.filter((m) => m.spots_left > 0) : rows;
}

export async function getMatch(id: string): Promise<MatchDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("match_details").select("*").eq("id", id).maybeSingle();
  return (data as MatchDetails | null) ?? null;
}

export async function getMatchesByIds(ids: string[]): Promise<Map<string, MatchDetails>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.from("match_details").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data as MatchDetails[]).map((m) => [m.id, m]));
}

export interface MatchPlayer {
  registration: Registration;
  profile: Pick<Profile, "id" | "full_name" | "phone">;
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayer[]> {
  const supabase = await createClient();

  const { data: regs, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("match_id", matchId)
    .neq("status", "cancelled")
    .order("status", { ascending: true })
    .order("position", { ascending: true, nullsFirst: true })
    .order("joined_at", { ascending: true });

  if (error) throw error;
  const registrations = (regs ?? []) as Registration[];
  if (registrations.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", registrations.map((r) => r.user_id));

  const byId = new Map(
    ((profiles ?? []) as Pick<Profile, "id" | "full_name" | "phone">[]).map((p) => [p.id, p]),
  );

  return registrations.map((registration) => ({
    registration,
    profile: byId.get(registration.user_id) ?? {
      id: registration.user_id,
      full_name: null,
      phone: null,
    },
  }));
}

export async function getViewerRegistration(
  matchId: string,
  userId: string,
): Promise<Registration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .maybeSingle();
  return (data as Registration | null) ?? null;
}

/** Proximos partidos del usuario. */
export async function listMyUpcomingMatches(
  userId: string,
): Promise<{ match: MatchDetails; registration: Registration }[]> {
  const supabase = await createClient();
  const { data: regs, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "cancelled");

  if (error) throw error;
  const registrations = (regs ?? []) as Registration[];
  if (registrations.length === 0) return [];

  const matches = await getMatchesByIds(registrations.map((r) => r.match_id));
  const now = Date.now();

  return registrations
    .map((registration) => ({ registration, match: matches.get(registration.match_id) }))
    .filter(
      (x): x is { registration: Registration; match: MatchDetails } =>
        !!x.match && x.match.status !== "cancelled" && new Date(x.match.starts_at).getTime() >= now,
    )
    .sort((a, b) => new Date(a.match.starts_at).getTime() - new Date(b.match.starts_at).getTime());
}

/** Relacion del usuario con una lista de partidos (para el badge "Anotado"). */
export async function getMyRelations(userId: string): Promise<Map<string, Registration["status"]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("match_id, status")
    .eq("user_id", userId)
    .neq("status", "cancelled");
  return new Map(((data ?? []) as Pick<Registration, "match_id" | "status">[]).map((r) => [r.match_id, r.status]));
}

/** Historial del usuario + estadisticas basicas. */
export async function getPlayerHistory(userId: string): Promise<{
  rows: PlayerHistoryRow[];
  stats: { played: number; upcoming: number; cancelled: number; byComplex: Record<string, number> };
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_history")
    .select("*")
    .eq("user_id", userId)
    .order("starts_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as PlayerHistoryRow[];

  const now = Date.now();
  const stats = {
    played: 0,
    upcoming: 0,
    cancelled: 0,
    byComplex: {} as Record<string, number>,
  };
  for (const row of rows) {
    if (row.registration_status === "cancelled") {
      stats.cancelled++;
      continue;
    }
    const past = new Date(row.starts_at).getTime() < now;
    if (row.match_status === "finished" || past) {
      stats.played++;
      stats.byComplex[row.complex_name] = (stats.byComplex[row.complex_name] ?? 0) + 1;
    } else {
      stats.upcoming++;
    }
  }
  return { rows, stats };
}

export async function getWaitlistEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "waitlist_enabled")
    .maybeSingle();
  return data ? Boolean(data.value) : true;
}

export async function listCities(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("complexes")
    .select("city")
    .eq("status", "active")
    .not("city", "is", null);
  const set = new Set<string>();
  ((data ?? []) as { city: string | null }[]).forEach((r) => r.city && set.add(r.city));
  return [...set].sort();
}
