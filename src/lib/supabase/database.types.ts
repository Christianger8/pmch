/**
 * Tipos de la base de datos.
 *
 * Para regenerar desde el esquema real:
 *   npm run db:types
 * (equivale a `supabase gen types typescript --local`)
 *
 * Esta version escrita a mano cubre lo que usa la app y sirve como fallback.
 */

export type RegistrationStatus = "confirmed" | "waitlist" | "cancelled";
export type MatchStatus = "open" | "full" | "cancelled" | "finished";
export type EntityStatus = "active" | "inactive";
export type SurfaceType = "indoor" | "outdoor";
export type UserRole = "player" | "admin";
export type NotificationType =
  | "registration_confirmed"
  | "waitlist_promoted"
  | "match_cancelled"
  | "removed_by_admin"
  | "reminder_24h"
  | "reminder_2h";

export interface Profile {
  id: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Complex {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  status: EntityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  complex_id: string;
  name: string;
  surface_type: SurfaceType;
  status: EntityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  complex_id: string;
  court_id: string;
  starts_at: string;
  duration_minutes: number;
  max_players: number;
  category: string | null;
  comments: string | null;
  status: MatchStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchDetails extends Match {
  complex_name: string;
  complex_address: string | null;
  complex_city: string | null;
  complex_province: string | null;
  court_name: string;
  court_surface_type: SurfaceType;
  confirmed_count: number;
  waitlist_count: number;
  spots_left: number;
}

export interface Registration {
  id: string;
  match_id: string;
  user_id: string;
  status: RegistrationStatus;
  position: number | null;
  joined_at: string;
  cancelled_at: string | null;
}

export interface PlayerHistoryRow {
  user_id: string;
  match_id: string;
  starts_at: string;
  duration_minutes: number;
  match_status: MatchStatus;
  registration_status: RegistrationStatus;
  complex_name: string;
  court_name: string;
  complex_city: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  match_id: string | null;
  type: NotificationType;
  channel: "push" | "sms" | "whatsapp";
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

interface TableShape<R> {
  Row: Row<R>;
  Insert: Insert<R>;
  Update: Update<R>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile>;
      complexes: TableShape<Complex>;
      complex_admins: TableShape<{ complex_id: string; user_id: string; created_at: string }>;
      courts: TableShape<Court>;
      matches: TableShape<Match>;
      registrations: TableShape<Registration>;
      notifications: TableShape<NotificationRow>;
      push_subscriptions: TableShape<{
        id: string;
        user_id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        created_at: string;
      }>;
      app_settings: TableShape<{ key: string; value: unknown; updated_at: string }>;
    };
    Views: {
      match_details: { Row: MatchDetails; Relationships: [] };
      player_history: { Row: PlayerHistoryRow; Relationships: [] };
    };
    Functions: {
      join_match: { Args: { target_match: string }; Returns: RegistrationStatus };
      leave_match: { Args: { target_match: string }; Returns: undefined };
      cancel_match: { Args: { target_match: string }; Returns: undefined };
      finish_match: { Args: { target_match: string }; Returns: undefined };
      admin_remove_player: { Args: { target_match: string; target_user: string }; Returns: undefined };
      admin_dashboard_stats: { Args: Record<string, never>; Returns: DashboardStats };
      is_admin: { Args: { uid?: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface DashboardStats {
  players: number;
  complexes: number;
  complexes_active: number;
  courts: number;
  matches_total: number;
  matches_open: number;
  matches_full: number;
  matches_cancelled: number;
  matches_finished: number;
  registrations_active: number;
  monthly: { month: string; matches: number; finished: number }[];
  occupancy_by_complex: { complex: string; matches: number; occupancy_pct: number }[];
  occupancy_by_court: { court: string; complex: string; matches: number; occupancy_pct: number }[];
}
