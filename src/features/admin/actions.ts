"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/auth/session";
import { localArgToUtcISO } from "@/lib/time";
import {
  complexSchema,
  courtSchema,
  matchSchema,
  removePlayerSchema,
} from "@/lib/validation/schemas";
import type { FormResult } from "./types";

function zodToFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.length ? String(i.path[0]) : "_";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Complejos
// ---------------------------------------------------------------------------
export async function saveComplex(id: string | null, _prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  const parsed = complexSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? "",
    city: formData.get("city") ?? "",
    province: formData.get("province") ?? "",
    status: formData.get("status") ?? "active",
  });
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    province: parsed.data.province || null,
    status: parsed.data.status,
  };

  const { error } = id
    ? await supabase.from("complexes").update(payload as any).eq("id", id)
    : await supabase.from("complexes").insert(payload as any);

  if (error) return { error: "No se pudo guardar el complejo" };

  revalidatePath("/admin/complexes");
  redirect("/admin/complexes");
}

export async function deleteComplex(id: string): Promise<FormResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("complexes").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar (revisa que no tenga partidos)" };
  revalidatePath("/admin/complexes");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Canchas
// ---------------------------------------------------------------------------
export async function saveCourt(id: string | null, _prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  const parsed = courtSchema.safeParse({
    complex_id: formData.get("complex_id"),
    name: formData.get("name"),
    surface_type: formData.get("surface_type") ?? "indoor",
    status: formData.get("status") ?? "active",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const payload = {
    complex_id: parsed.data.complex_id,
    name: parsed.data.name,
    surface_type: parsed.data.surface_type,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  };

  const { error } = id
    ? await supabase.from("courts").update(payload as any).eq("id", id)
    : await supabase.from("courts").insert(payload as any);

  if (error) return { error: "No se pudo guardar la cancha" };

  revalidatePath("/admin/courts");
  redirect("/admin/courts");
}

export async function setCourtStatus(id: string, status: "active" | "inactive"): Promise<FormResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("courts").update({ status } as any).eq("id", id);
  if (error) return { error: "No se pudo actualizar la cancha" };
  revalidatePath("/admin/courts");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Partidos
// ---------------------------------------------------------------------------
export async function saveMatch(id: string | null, _prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  const parsed = matchSchema.safeParse({
    complex_id: formData.get("complex_id"),
    court_id: formData.get("court_id"),
    starts_at_local: formData.get("starts_at_local"),
    duration_minutes: formData.get("duration_minutes"),
    max_players: formData.get("max_players"),
    category: formData.get("category") ?? "",
    comments: formData.get("comments") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error.issues) };

  let startsAt: string;
  try {
    startsAt = localArgToUtcISO(parsed.data.starts_at_local);
  } catch {
    return { fieldErrors: { starts_at_local: "Fecha y hora invalidas" } };
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

  const { error } = id
    ? await supabase.from("matches").update(payload as any).eq("id", id)
    : await supabase.from("matches").insert(payload as any);

  if (error) return { error: "No se pudo guardar el partido" };

  revalidatePath("/admin/matches");
  revalidatePath("/");
  redirect("/admin/matches");
}

export async function cancelMatch(id: string): Promise<FormResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_match", { target_match: id });
  if (error) return { error: "No se pudo cancelar el partido" };
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function finishMatch(id: string): Promise<FormResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_match", { target_match: id });
  if (error) return { error: "No se pudo finalizar el partido" };
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${id}`);
  return { ok: true };
}

export async function removePlayer(matchId: string, userId: string): Promise<FormResult> {
  await requireAdmin();
  const parsed = removePlayerSchema.safeParse({ match_id: matchId, user_id: userId });
  if (!parsed.success) return { error: "Datos invalidos" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_player", {
    target_match: matchId,
    target_user: userId,
  });
  if (error) return { error: "No se pudo quitar al jugador" };
  revalidatePath(`/admin/matches/${matchId}`);
  return { ok: true };
}
