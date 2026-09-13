// DIAGNOSTICO TEMPORAL - borrar despues de usar.
// Lee process.env directo (no pasa por lib/env.ts) para ver el valor crudo
// que Vercel esta inyectando en runtime, sin ninguna validacion de por medio.
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return NextResponse.json({
    urlSeen: url,
    keyLength: key.length,
    keyStart: key.slice(0, 15),
    keyEnd: key.slice(-10),
    keyHasBulletChar: /[•●∙]/.test(key),
    charCodes15to25: key
      .slice(15, 25)
      .split("")
      .map((c) => c.charCodeAt(0)),
  });
}
