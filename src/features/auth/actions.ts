"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { argMobileToE164 } from "@/lib/format";
import {
  emailSchema,
  onboardingSchema,
  otpChannelSchema,
  otpSchema,
  phoneSchema,
  type OtpChannel,
} from "@/lib/validation/schemas";
import { env } from "@/lib/env";
import type { ActionState } from "./types";

function resolveChannel(value: FormDataEntryValue | null): OtpChannel {
  const parsed = otpChannelSchema.safeParse(value);
  return parsed.success ? parsed.data : env.defaultOtpChannel;
}

/** Paso 1: enviar el codigo OTP por WhatsApp o SMS. */
export async function requestOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = phoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success) return { error: "Ingresa un numero de celular valido" };

  const phone = argMobileToE164(parsed.data);
  const channel = resolveChannel(formData.get("channel"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel } });

  if (error) return { error: traducirError(error.message) };

  const next = (formData.get("next") as string) || "/";
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
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data });

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
  const { error } = await supabase.auth.signInWithOtp({ email });
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
  return "No pudimos completar la operacion. Reintenta.";
}
