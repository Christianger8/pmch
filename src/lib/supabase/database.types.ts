/**
 * Tipos de la base de datos.
 *
 * El tipo `Database` de mas abajo esta generado directamente desde el
 * proyecto real de Supabase (equivalente a `supabase gen types typescript`,
 * corrido via el conector). No editar a mano: para regenerarlo despues de
 * una migracion nueva, correr:
 *
 *   npm run db:types
 *
 * Los tipos de dominio (Profile, Complex, Match, MatchDetails, etc.) son
 * propios de la app -no forman parte de `Database`- y se usan para tipar lo
 * que devuelven las queries (`as MatchDetails[]`, etc.). Los mantenemos
 * separados a proposito: `Database` describe columnas tal cual las ve
 * Postgres (mayormente `string`), y estos tipos le dan al resto del codigo
 * los literales (`"open" | "full" | ...`) que realmente usa la UI.
 */

// ---------------------------------------------------------------------------
// Database (generado desde Supabase)
// ---------------------------------------------------------------------------
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      complex_admins: {
        Row: {
          complex_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          complex_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          complex_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complex_admins_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complex_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      complexes: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          province: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          province?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          province?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complexes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courts: {
        Row: {
          complex_id: string;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          status: string;
          surface_type: string;
          updated_at: string;
        };
        Insert: {
          complex_id: string;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          status?: string;
          surface_type?: string;
          updated_at?: string;
        };
        Update: {
          complex_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          status?: string;
          surface_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courts_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          category: string | null;
          comments: string | null;
          complex_id: string;
          court_id: string;
          created_at: string;
          created_by: string | null;
          duration_minutes: number;
          id: string;
          max_players: number;
          starts_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          comments?: string | null;
          complex_id: string;
          court_id: string;
          created_at?: string;
          created_by?: string | null;
          duration_minutes?: number;
          id?: string;
          max_players?: number;
          starts_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          comments?: string | null;
          complex_id?: string;
          court_id?: string;
          created_at?: string;
          created_by?: string | null;
          duration_minutes?: number;
          id?: string;
          max_players?: number;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          channel: string;
          created_at: string;
          data: Json;
          error: string | null;
          id: string;
          match_id: string | null;
          scheduled_for: string;
          sent_at: string | null;
          status: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body: string;
          channel?: string;
          created_at?: string;
          data?: Json;
          error?: string | null;
          id?: string;
          match_id?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string;
          channel?: string;
          created_at?: string;
          data?: Json;
          error?: string | null;
          id?: string;
          match_id?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          status?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "match_details";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "player_history";
            referencedColumns: ["match_id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          onboarded: boolean;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          onboarded?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          onboarded?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      registrations: {
        Row: {
          cancelled_at: string | null;
          id: string;
          joined_at: string;
          match_id: string;
          position: number | null;
          status: string;
          user_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          id?: string;
          joined_at?: string;
          match_id: string;
          position?: number | null;
          status?: string;
          user_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          id?: string;
          joined_at?: string;
          match_id?: string;
          position?: number | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "match_details";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "player_history";
            referencedColumns: ["match_id"];
          },
          {
            foreignKeyName: "registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      match_details: {
        Row: {
          category: string | null;
          comments: string | null;
          complex_address: string | null;
          complex_city: string | null;
          complex_id: string | null;
          complex_name: string | null;
          complex_province: string | null;
          confirmed_count: number | null;
          court_id: string | null;
          court_name: string | null;
          court_surface_type: string | null;
          created_at: string | null;
          created_by: string | null;
          duration_minutes: number | null;
          id: string | null;
          max_players: number | null;
          spots_left: number | null;
          starts_at: string | null;
          status: string | null;
          updated_at: string | null;
          waitlist_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      player_history: {
        Row: {
          complex_city: string | null;
          complex_name: string | null;
          court_name: string | null;
          duration_minutes: number | null;
          match_id: string | null;
          match_status: string | null;
          registration_status: string | null;
          starts_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json };
      admin_remove_player: {
        Args: { target_match: string; target_user: string };
        Returns: undefined;
      };
      cancel_match: { Args: { target_match: string }; Returns: undefined };
      enqueue_due_reminders: { Args: never; Returns: number };
      finish_match: { Args: { target_match: string }; Returns: undefined };
      is_admin: { Args: { uid?: string }; Returns: boolean };
      is_complex_admin: {
        Args: { target_complex: string; uid?: string };
        Returns: boolean;
      };
      join_match: { Args: { target_match: string }; Returns: string };
      leave_match: { Args: { target_match: string }; Returns: undefined };
      recalc_match_status: {
        Args: { target_match: string };
        Returns: undefined;
      };
      run_reminders_tick: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Tipos de dominio (propios de la app, no de Database)
// ---------------------------------------------------------------------------
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
