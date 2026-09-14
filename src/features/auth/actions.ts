"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { argMobileToE164 } from "@/lib/format";
import { derivePlayerPassword } from "@/lib/player-auth";
import {
  emailSchema,
  onboardingSchema,
  otpSchema,
  phoneSchema,
  type OtpChannel,
} from "@/lib/validation/schemas";
import { env } from "@/lib/env";
import type { ActionState, PhoneCheckResult } from "./types";

/**
 * Paso 1 del login: solo el celular. Si ya esta registrado (lo cargo un
 * admin, o ya inicio sesion antes) el paso 2 manda el codigo directo por el
 * canal por defecto. Si es nuevo, recien ahi se pregunta WhatsApp o SMS.
 */
export async function checkPhone(localNumber: string): Promise<PhoneCheckResult> {
  const parsed = phoneSchema.safeParse(localNumber);
  if (!parsed.success) return { ok: false, error: "Ingresa un numero de celular valido" };

  const phone = argMobileToE164(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("phone_is_registered", { check_phone: phone });

  if (error) return { ok: false, error: "No pudimos verificar el numero. Reintenta." };
  return { ok: true, phone, registered: Boolean(data) };
}

/**
 * Login directo para un celular que un admin ya cargo como jugador (sin
 * WhatsApp/SMS todavia). Ver src/lib/player-auth.ts para el porque y las
 * implicancias de seguridad de este atajo temporal.
 */
export async function loginRegisteredPlayer(phone: string, next: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    phone,
    password: derivePlayerPassword(phone),
  });

  if (error) {
    return { error: "No pudimos ingresarte. Pedile a un administrador que revise tu numero." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/** Paso 2: enviar el codigo OTP por WhatsApp o SMS al celular ya verificado en el paso 1. */
export async function sendOtp(
  phone: string,
  channel: OtpChannel,
  next: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel } });

  if (error) return { error: traducirError(error.message) };

  redirect(
    `/login/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&channel=${channel}`,
  );
}

/** Paso 2: verificar el codigo. */
export async function verifyOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = otpSchema.safeParse(formData.get("token"));
  const phoneRaw = formData.get("phone");
  if (!token.success || typeof phoneRaw !== "string") {
    return { error: "Codigo invalido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: phoneRaw,
    token: token.data,
    type: "sms",
  });

  if (error) return { error: traducirError(error.message) };

  const next = (formData.get("next") as string) || "/";
  revalidatePath("/", "layout");
  redirect(next);
}

export async function resendOtp(phone: string, channel?: OtpChannel): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: channel ?? env.defaultOtpChannel },
  });
  if (error) return { error: traducirError(error.message) };
  return { ok: true };
}

/**
 * Ingreso alternativo por email, solo pensado para administradores mientras
 * no hay un proveedor de WhatsApp/SMS configurado. Usa el envio de correo
 * propio de Supabase (sin Twilio ni ningun proveedor externo).
 */
export async function requestAdminOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Ingresa un email valido" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    // Si tocan el link del email en vez de tipear el codigo, que la sesion
    // se complete de verdad (antes no habia ninguna ruta que lo recibiera).
    options: { emailRedirectTo: `${env.appUrl}/auth/confirm` },
  });

  if (error) return { error: traducirError(error.message) };

  redirect(`/login/admin/verify?email=${encodeURIComponent(parsed.data)}`);
}

export async function verifyAdminOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = otpSchema.safeParse(formData.get("token"));
  const emailRaw = formData.get("email");
  if (!token.success || typeof emailRaw !== "string") {
    return { error: "Codigo invalido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: emailRaw,
    token: token.data,
    type: "email",
  });

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function resendAdminOtp(email: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${env.appUrl}/auth/confirm` },
  });
  if (error) return { error: traducirError(error.message) };
  return { ok: true };
}

/** Completar el nombre en el primer ingreso. */
export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse({ full_name: formData.get("full_name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, onboarded: true })
    .eq("id", user.id);

  if (error) return { error: "No pudimos guardar tus datos. Reintenta." };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function traducirError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid") && m.includes("token")) return "El codigo es incorrecto o expiro";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("expired")) return "El codigo expiro. Pedi uno nuevo.";
  if (m.includes("phone_provider_disabled") || m.includes("unsupported phone provider")) {
    return "El ingreso por WhatsApp/SMS todavia no esta activado. Pedile a un administrador que te cargue como jugador.";
  }
  return "No pudimos completar la operacion. Reintenta.";
}
