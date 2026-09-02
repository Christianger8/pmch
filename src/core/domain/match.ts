import type { MatchDetails, MatchStatus, RegistrationStatus } from "@/lib/supabase/database.types";

/**
 * Reglas de dominio puras sobre un partido. Sin dependencias de infraestructura:
 * son las mismas que aplican las funciones SQL, replicadas en el cliente para
 * poder mostrar/ocultar acciones sin ida y vuelta al servidor.
 */

export function isFull(m: Pick<MatchDetails, "confirmed_count" | "max_players">): boolean {
  return m.confirmed_count >= m.max_players;
}

export function isPast(m: Pick<MatchDetails, "starts_at">): boolean {
  return new Date(m.starts_at).getTime() < Date.now();
}

export function isJoinable(m: MatchDetails): boolean {
  return m.status !== "cancelled" && m.status !== "finished" && !isPast(m);
}

export function spotsLeft(m: Pick<MatchDetails, "confirmed_count" | "max_players">): number {
  return Math.max(m.max_players - m.confirmed_count, 0);
}

export type ViewerRelation = "none" | "confirmed" | "waitlist";

export interface MatchActionState {
  canJoin: boolean;
  canJoinWaitlist: boolean;
  canLeave: boolean;
  label: string;
}

export function resolveActionState(
  m: MatchDetails,
  relation: ViewerRelation,
  waitlistEnabled: boolean,
): MatchActionState {
  if (relation === "confirmed") {
    return { canJoin: false, canJoinWaitlist: false, canLeave: true, label: "Anotado" };
  }
  if (relation === "waitlist") {
    return { canJoin: false, canJoinWaitlist: false, canLeave: true, label: "En lista de espera" };
  }
  if (!isJoinable(m)) {
    return { canJoin: false, canJoinWaitlist: false, canLeave: false, label: statusLabel(m.status) };
  }
  if (isFull(m)) {
    return {
      canJoin: false,
      canJoinWaitlist: waitlistEnabled,
      canLeave: false,
      label: waitlistEnabled ? "Anotarme en lista de espera" : "Partido completo",
    };
  }
  return { canJoin: true, canJoinWaitlist: false, canLeave: false, label: "Quiero jugar" };
}

export function statusLabel(status: MatchStatus): string {
  switch (status) {
    case "open":
      return "Lugares disponibles";
    case "full":
      return "Partido completo";
    case "cancelled":
      return "Cancelado";
    case "finished":
      return "Finalizado";
  }
}

export function registrationLabel(status: RegistrationStatus): string {
  switch (status) {
    case "confirmed":
      return "Confirmado";
    case "waitlist":
      return "Lista de espera";
    case "cancelled":
      return "Cancelado";
  }
}
