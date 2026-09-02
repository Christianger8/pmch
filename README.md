# PadelMatch

WebApp (PWA) para organizar partidos de pádel: los administradores publican
partidos y los jugadores se anotan hasta completar el cupo, todo desde el celular
en pocos segundos.

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · modo oscuro
- **Backend:** Supabase (Auth por OTP en WhatsApp o SMS · PostgreSQL · RLS · Realtime · Edge Functions)
- **PWA:** instalable en Android / iPhone / desktop, con service worker y push
- **Arquitectura:** dominio puro (`src/core`) + capa de features (`src/features`) + UI (`src/app`, `src/components`)

## Funcionalidades del MVP

| Jugador | Administrador |
|---|---|
| Registro e inicio de sesión por celular (OTP WhatsApp / SMS) | Alta/edición/baja de complejos |
| Ver y filtrar partidos disponibles | Alta/edición y activar/desactivar canchas |
| Anotarse / cancelar inscripción | Crear/editar/cancelar/finalizar partidos |
| Lista de espera automática | Ver inscriptos y quitar jugadores |
| Compartir por WhatsApp | Panel con métricas y ocupación |
| Agregar al calendario (.ics) | |
| Próximos partidos e historial + estadísticas | |
| Recordatorios 24 h y 2 h antes | |

## Puesta en marcha (local)

Requisitos: **Node 20+**, **Docker** (para Supabase local) y la
[CLI de Supabase](https://supabase.com/docs/guides/cli).

```bash
npm install
cp .env.example .env.local        # completá los valores (ver abajo)

# 1) Levantar Supabase local (Postgres + Auth + Studio + Edge runtime)
supabase start

# 2) Aplicar migraciones y datos de ejemplo
supabase db reset

# 3) Generar los tipos de la base (opcional, ya hay una versión a mano)
npm run db:types

# 4) Generar los íconos PNG de la PWA
npm run icons

# 5) Arrancar la app
npm run dev
```

`supabase start` imprime `API URL`, `anon key` y `service_role key`: copialos a
`.env.local`. `NEXT_PUBLIC_APP_URL` en local es `http://localhost:3000`.

### Usuario de prueba

El seed crea un **admin** con teléfono `+54 9 11 0000 0000`. En local el OTP de
ese número es `123456` (definido en `supabase/config.toml`). Cualquier otro
número recibe el código por el buzón de Inbucket (`http://localhost:54324`).

> En local usá el canal **SMS** en la pantalla de login
> (`NEXT_PUBLIC_DEFAULT_OTP_CHANNEL=sms`): WhatsApp requiere un remitente real de
> Twilio. Ver `docs/DEPLOYMENT.md` §2.2.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `start` | Build y arranque de producción |
| `npm run typecheck` | Chequeo de tipos |
| `npm run test` | Tests de dominio (Vitest) |
| `npm run icons` | Genera los PNG de la PWA desde los SVG |
| `npm run db:reset` | Recrea la base con migraciones + seed |
| `npm run db:types` | Regenera `src/lib/supabase/database.types.ts` |

## Estructura

```
src/
  core/domain/        Reglas puras de negocio (sin infra) + tests
  lib/                Supabase clients, env, ICS, WhatsApp, formato, validación (zod)
  features/
    auth/             Sesión + server actions de login/onboarding
    matches/          Queries y actions de partidos + componentes
    admin/            Queries y actions de complejos/canchas/partidos + dashboard
  components/         UI reutilizable (button, card, field, toast, nav…)
  app/
    (auth)/           /login, /login/verify
    onboarding/       Alta de nombre en el primer ingreso
    (app)/            Shell con sesión: partidos, /me/*, /admin/*
    api/matches/[id]/ics   Descarga del .ics
    manifest.ts       Web App Manifest
supabase/
  migrations/         Esquema, funciones RPC, RLS, cron
  functions/reminders Edge Function que despacha notificaciones
  seed.sql            Datos de ejemplo (solo local)
```

## Despliegue

Ver **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** para el paso a paso completo
(Supabase en la nube + Vercel + tu dominio + Twilio para WhatsApp/SMS + recordatorios).

## Arquitectura y decisiones

Ver **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
