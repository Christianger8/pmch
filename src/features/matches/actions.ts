"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/session";
import { localArgToUtcISO } from "@/lib/time";
import { zodToFieldErrors } from "@/lib/zod-errors";
import { matchIdSchema, matchSchema } from "@/lib/validation/schemas";
import type { FormResult } from "@/features/admin/types";
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

/**
 * Crear o editar un partido. Cualquier usuario logueado puede crear uno
 * (queda como organizador via matches.created_by). Para editar uno
 * existente hace falta ser el organizador o el admin del complejo -- lo
 * exige la RLS ("matches: organizer update own" / "matches: admin write");
 * si ninguna de las dos aplica, el update no afecta ninguna fila y
 * devolvemos un error generico.
 */
export async function saveMatch(id: string | null, _prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const parsed = matchSchema.safeParse({
    complex_id: formData.get("complex_id"),
    court_id: formData.get("court_id"),
    starts_at_date: formData.get("starts_at_date"),
    starts_at_time: formData.get("starts_at_time"),
    duration_minutes: formData.get("duration_minutes"),
    max_players: formData.get("max_players"),
    category: formData.get("category") ?? "",
    comments: formData.get("comments") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error.issues) };

  let startsAt: string;
  try {
    startsAt = localArgToUtcISO(`${parsed.data.starts_at_date}T${parsed.data.starts_at_time}`);
  } catch {
    return { fieldErrors: { starts_at_date: "Fecha y hora invalidas" } };
  }

  const supabase = await createClient();
  const payload = {
    complex_id: parsed.data.complex_id,
    court_id: parsed.data.court_id,
    starts_at: startsAt,
    duration_minutes: parsed.data.duration_minutes,
    max_players: parsed.data.max_players,
    category: parsed.data.category || null,
    comments: parsed.data.comments || null,
  };

  let matchId = id;
  if (id) {
    const { error } = await supabase.from("matches").update(payload).eq("id", id);
    if (error) return { error: "No se pudo guardar el partido (¿sos el organizador o el admin?)" };
  } else {
    const { data: created, error } = await supabase
      .from("matches")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) return { error: "No se pudo crear el partido" };
    matchId = created.id;
  }

  revalidatePath("/admin/matches");
  revalidatePath("/");
  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}

/** Cancelar un partido: lo puede hacer el organizador o el admin. */
export async function cancelMatch(id: string): Promise<FormResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_match", { target_match: id });
  if (error) return { error: mapError(error.message) };
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  revalidatePath("/");
  return { ok: true };
}

/** Marcar un partido como finalizado: lo puede hacer el organizador o el admin. */
export async function finishMatch(id: string): Promise<FormResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_match", { target_match: id });
  if (error) return { error: mapError(error.message) };
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/matches/${id}`);
  return { ok: true };
}
