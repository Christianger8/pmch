import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * Adonde llega el link "Sign in" del email de Supabase (magic link). Hasta
 * ahora no existia ninguna ruta que lo recibiera: el link redirigia a la app
 * pero nadie completaba el login (el codigo PKCE de la URL se perdia y el
 * usuario quedaba igual que antes, sin sesion).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${env.appUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${env.appUrl}/login?error=confirm_failed`);
}
