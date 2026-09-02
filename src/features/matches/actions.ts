"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/session";
import { matchIdSchema } from "@/lib/validation/schemas";
import type { MatchActionResult } from "./types";

const RPC_ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Necesitas iniciar sesion",
  MATCH_NOT_FOUND: "El partido no existe",
  MATCH_CANCELLED: "El partido fue cancelado",
  MATCH_ALREADY_STARTED: "El partido ya empezo",
  MATCH_FULL: "El partido esta completo",
  FORBIDDEN: "No tenes permisos para esta accion",
};

function mapError(message: string): string {
  const key = Object.keys(RPC_ERRORS).find((k) => message.includes(k));
  return key ? RPC_ERRORS[key] : "No pudimos completar la accion. Reintenta.";
}

/** "Quiero jugar" / "Anotarme en lista de espera" */
export async function joinMatch(matchId: string): Promise<MatchActionResult> {
  const parsed = matchIdSchema.safeParse({ match_id: matchId });
  if (!parsed.success) return { ok: false, error: "Partido invalido" };

  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_match", { target_match: matchId });

  if (error) return { ok: false, error: mapError(error.message) };

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/me/upcoming");
  return { ok: true, status: data as "confirmed" | "waitlist" };
}

/** Cancelar inscripcion. */
export async function leaveMatch(matchId: string): Promise<MatchActionResult> {
  const parsed = matchIdSchema.safeParse({ match_id: matchId });
  if (!parsed.success) return { ok: false, error: "Partido invalido" };

  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_match", { target_match: matchId });

  if (error) return { ok: false, error: mapError(error.message) };

  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/me/upcoming");
  return { ok: true };
}
