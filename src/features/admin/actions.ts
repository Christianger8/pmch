"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/auth/session";
import { argMobileToE164, displayPhone, toAuthPhone } from "@/lib/format";
import { derivePlayerPassword } from "@/lib/player-auth";
import { zodToFieldErrors } from "@/lib/zod-errors";
import { complexSchema, courtSchema, playerSchema, removePlayerSchema } from "@/lib/validation/schemas";
import type { FormResult } from "./types";

// ---------------------------------------------------------------------------
// Jugadores (carga manual)
// ---------------------------------------------------------------------------
/**
 * Crea un jugador directo en la base (auth.users + profiles), sin pasar por
 * el login. Sirve para armar el padron de antemano: cuando ese celular
 * entre por primera vez con WhatsApp/SMS, Supabase lo reconoce y lo engancha
 * con este mismo perfil en vez de pedirle que se registre de nuevo.
 */
export async function createPlayer(_prev: FormResult, formData: FormData): Promise<FormResult> {
  await requireAdmin();
  const parsed = playerSchema.safeParse({
    full_name: formData.get("full_name"),
    phone_local: formData.get("phone_local"),
  });
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error.issues) };

  const phone = argMobileToE164(parsed.data.phone_local);
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    // Supabase persiste el celular sin el "+" (ver toAuthPhone). La
    // contrasena se deriva siempre de la version con "+" (mas abajo, en
    // loginRegisteredPlayer, se usa la misma) para que no dependa de este
    // detalle interno de Supabase.
    phone: toAuthPhone(phone),
    phone_confirm: true,
    // Permite el login sin OTP mientras no hay WhatsApp/SMS conectado.
    // Ver src/lib/player-auth.ts.
    password: derivePlayerPassword(phone),
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? "";
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
      return { fieldErrors: { phone_local: "Ya hay un jugador con ese celular" } };
    }
    return { error: "No se pudo crear el jugador" };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ full_name: parsed.data.full_name, onboarded: true })
    .eq("id", created.user.id);

  if (updateError) return { error: "El jugador se creo, pero no se pudo guardar el nombre" };

  revalidatePath("/admin/players");
  return { ok: true };
}

export async function deletePlayer(id: string): Promise<FormResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: "No se pudo eliminar el jugador" };
  revalidatePath("/admin/players");
  return { ok: true };
}

/**
 * Vuelve a calcular la contrasena de acceso directo (ver src/lib/player-auth.ts)
 * para la cuenta que esta ejecutando la accion, usando el
 * PLAYER_AUTO_LOGIN_SECRET que de verdad esta cargado en el servidor en
 * este momento. Sirve para reparar el propio login por celular cuando esa
 * contrasena se seteo alguna vez a mano (por SQL) con un secreto viejo o
 * adivinado, o si el secreto se rota alguna vez.
 */
export async function resyncMyDirectLoginPassword(): Promise<FormResult> {
  const user = await requireAdmin();
  if (!user.phone) return { error: "Tu cuenta no tiene un celular cargado" };

  const admin = createAdminClient();
  const phone = displayPhone(user.phone); // con "+", igual que en el resto de la app
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: derivePlayerPassword(phone),
  });
  if (error) return { error: "No se pudo actualizar la contrasena" };
  return { ok: true };
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

  if (id) {
    const { error } = await supabase.from("complexes").update(payload).eq("id", id);
    if (error) return { error: "No se pudo guardar el complejo" };
  } else {
    const { error } = await supabase.from("complexes").insert(payload);
    if (error) return { error: "No se pudo guardar el complejo" };
  }

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

  if (id) {
    const { error } = await supabase.from("courts").update(payload).eq("id", id);
    if (error) return { error: "No se pudo guardar la cancha" };
  } else {
    const { error } = await supabase.from("courts").insert(payload);
    if (error) return { error: "No se pudo guardar la cancha" };
  }

  revalidatePath("/admin/courts");
  redirect("/admin/courts");
}

export async function setCourtStatus(id: string, status: "active" | "inactive"): Promise<FormResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("courts").update({ status }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la cancha" };
  revalidatePath("/admin/courts");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Partidos
// ---------------------------------------------------------------------------
// saveMatch/cancelMatch/finishMatch se mudaron a @/features/matches/actions:
// desde que los jugadores tambien pueden organizar partidos (no solo el
// admin), ya no son acciones exclusivas de este feature.

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
