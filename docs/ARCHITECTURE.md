# Arquitectura

## Capas

```
┌─────────────────────────────────────────────────────────────┐
│  app/  ·  components/           Presentación (RSC + Client)  │
│    - Server Components leen datos vía features/*/queries      │
│    - Client Components disparan features/*/actions            │
├─────────────────────────────────────────────────────────────┤
│  features/                      Aplicación (casos de uso)     │
│    auth · matches · admin                                     │
│    - queries.ts  → lectura (repositorio sobre Supabase)       │
│    - actions.ts  → escritura ("use server", valida con zod)   │
├─────────────────────────────────────────────────────────────┤
│  core/domain/                   Dominio (puro, testeable)     │
│    - reglas: isFull, resolveActionState, spotsLeft…           │
│    - sin imports de Next ni de Supabase                       │
├─────────────────────────────────────────────────────────────┤
│  lib/                           Infraestructura               │
│    supabase (client/server/middleware) · ics · whatsapp ·     │
│    env · time · validation                                    │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)          Reglas críticas en la base    │
│    - RPC SECURITY DEFINER con lock de fila para concurrencia  │
│    - RLS en todas las tablas                                  │
│    - Vistas match_details / player_history (security_invoker) │
└─────────────────────────────────────────────────────────────┘
```

**Regla de dependencia:** las flechas apuntan hacia adentro. `core` no conoce a
nadie; `features` conoce a `core` y `lib`; `app` conoce a `features`.

## Por qué la lógica de inscripción vive en Postgres

`join_match` / `leave_match` / `admin_remove_player` son funciones
`SECURITY DEFINER` que hacen `SELECT … FOR UPDATE` sobre la fila del partido.
Esto evita *races* cuando varios jugadores tocan "Quiero jugar" a la vez para el
último lugar: la base serializa, decide `confirmed` vs `waitlist`, promueve al
primero de la lista de espera cuando alguien se baja y encola las notificaciones,
todo en una transacción. El cliente replica las mismas reglas en `core/domain`
solo para mostrar/ocultar botones.

## Autenticación y autorización

- **Auth:** Supabase Auth con OTP por SMS (sin usuario/contraseña). El trigger
  `handle_new_user` crea el `profile`. El onboarding sólo pide el nombre.
- **Sesión:** cookies vía `@supabase/ssr`. El `middleware.ts` refresca la sesión
  en cada request y hace el *guard* de rutas (`/login`, `/onboarding`, `/admin`).
- **Autorización:** `is_admin()` e `is_complex_admin(complex_id)` en SQL; las
  policies de RLS las usan para el catálogo. Los Server Actions revalidan con
  `requireUser()` / `requireAdmin()` antes de tocar la base.

## Datos y realtime

- Lectura desde Server Components → siempre fresca, sin cache de fetch.
- `RealtimeRefresh` (client) se suscribe a `postgres_changes` de `registrations`
  y `matches` y llama `router.refresh()` para revalidar la RSC.
- `revalidatePath` en los actions cubre al que ejecuta la acción.

## Modelo de datos

| Tabla | Rol |
|---|---|
| `profiles` | 1:1 con `auth.users`; `role` = player/admin |
| `complexes` / `complex_admins` | Clubes y sus administradores (multi-tenant) |
| `courts` | Canchas por complejo |
| `matches` | Partido; `status` open/full/cancelled/finished (derivado por `recalc_match_status`) |
| `registrations` | Inscripción + lista de espera (`status`, `position`) |
| `notifications` | Cola de envíos (confirmaciones, avisos, recordatorios) |
| `push_subscriptions` | Endpoints Web Push |
| `app_settings` | Config key/value (waitlist on/off, defaults…) |

Vistas: `match_details` (conteos + lugares) y `player_history`.

## Extensibilidad (funciones futuras previstas)

La forma actual deja lugar para crecer sin reescribir:

| Feature futura | Punto de extensión |
|---|---|
| Pago del partido (Mercado Pago / Stripe) | Tabla `payments` + estado en `registrations`; webhook como Edge Function |
| Ranking / handicap / nivel | Columnas en `profiles` + tabla `match_results`; `core/domain` para el cálculo |
| Chat del partido / comentarios | Tabla `match_messages` + canal Realtime por `match_id` |
| Confirmación de asistencia | `registrations.attendance_status` + recordatorio que pide confirmar |
| Armado automático de parejas / partidos equilibrados | Servicio en `core/` que consume nivel; job o action de admin |
| Torneos / ligas / campeonatos | Nuevo módulo `features/tournaments` + tablas propias; los partidos ya referencian complejo/cancha |
| App nativa | El backend es HTTP + Realtime; se reusa tal cual desde React Native |

## Testing

`npm run test` corre las reglas de `core/domain` con Vitest (sin base, sin red).
Es la red de seguridad barata para la lógica de cupos y lista de espera.
