import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";

export interface SessionUser {
  id: string;
  phone: string | null;
  profile: Profile;
}

/** Devuelve el usuario + profile, o null si no hay sesion. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { id: user.id, phone: user.phone ?? null, profile: profile as Profile };
}

/** Igual que getSessionUser pero redirige a /login si no hay sesion. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.profile.onboarded) redirect("/onboarding");
  return user;
}

/** Exige rol admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.profile.role !== "admin") redirect("/");
  return user;
}
