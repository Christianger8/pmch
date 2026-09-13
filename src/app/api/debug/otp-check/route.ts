// DIAGNOSTICO TEMPORAL - borrar despues de usar.
// Devuelve el error real de Supabase (no el traducido) para depurar el
// ingreso por email en produccion, sin poder leer logs de Vercel.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOtp({ email: "chg@cher.com.ar" });

  return NextResponse.json({
    supabaseUrlSeen: env.supabaseUrl,
    anonKeyLength: env.supabaseAnonKey.length,
    anonKeyStart: env.supabaseAnonKey.slice(0, 12),
    anonKeyEnd: env.supabaseAnonKey.slice(-12),
    ok: !error,
    data,
    error: error
      ? { message: error.message, status: error.status, name: error.name, code: (error as { code?: string }).code }
      : null,
  });
}
