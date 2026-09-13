/**
 * Acceso centralizado y validado a las variables de entorno.
 * Falla rapido en el arranque si falta algo critico.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Falta la variable de entorno ${name}. Copiala de .env.example`);
  }
  return value;
}

const otpChannel = process.env.NEXT_PUBLIC_DEFAULT_OTP_CHANNEL === "sms" ? "sms" : "whatsapp";

// Ojo: algunos paneles (Vercel incluido) pueden dejar una variable "cargada"
// pero vacia. `??` no lo detecta (solo cubre null/undefined), por eso el
// chequeo explicito de string vacio/con espacios antes del default.
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const env = {
  appUrl: (rawAppUrl && rawAppUrl.length > 0 ? rawAppUrl : "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /** Canal por defecto para el codigo de ingreso: "whatsapp" (default) o "sms". */
  defaultOtpChannel: otpChannel as "whatsapp" | "sms",
};

/** Solo disponible en el servidor. */
export function serviceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
