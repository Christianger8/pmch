import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { env, serviceRoleKey } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Cliente Supabase para Server Components, Route Handlers y Server Actions.
 * Usa las cookies de la request para propagar la sesion del usuario.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: lo maneja el middleware.
        }
      },
    },
  });
}

/**
 * Cliente con service role. Ignora RLS. Usar SOLO en el servidor y para tareas
 * de sistema (despacho de notificaciones, jobs). Nunca a partir de input directo
 * del usuario sin validar autorizacion antes.
 */
export function createAdminClient() {
  return createServiceClient<Database>(env.supabaseUrl, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
