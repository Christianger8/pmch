-- ============================================================================
-- PadelMatch · Esquema base
-- ============================================================================
-- Convenciones:
--   * Todas las tablas en el schema `public`.
--   * `id uuid` con `gen_random_uuid()`.
--   * `created_at` / `updated_at` en todas las tablas mutables.
--   * Los enums de estado se modelan como CHECK sobre text para poder
--     evolucionarlos sin `ALTER TYPE`.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_net"; -- para invocar Edge Functions desde cron

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  phone        text,
  full_name    text,
  avatar_url   text,
  role         text not null default 'player' check (role in ('player', 'admin')),
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is 'Datos de perfil. role=admin es administrador global.';

-- Crea el profile automaticamente al registrarse por OTP.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- complexes
-- ---------------------------------------------------------------------------
create table public.complexes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,
  province    text,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_complexes_updated
  before update on public.complexes
  for each row execute function public.set_updated_at();

create index complexes_status_idx on public.complexes (status);
create index complexes_city_idx on public.complexes (city);

-- ---------------------------------------------------------------------------
-- complex_admins  (administradores por complejo — multi-tenant)
-- ---------------------------------------------------------------------------
create table public.complex_admins (
  complex_id  uuid not null references public.complexes (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (complex_id, user_id)
);

-- ---------------------------------------------------------------------------
-- courts
-- ---------------------------------------------------------------------------
create table public.courts (
  id            uuid primary key default gen_random_uuid(),
  complex_id    uuid not null references public.complexes (id) on delete cascade,
  name          text not null,
  surface_type  text not null default 'indoor' check (surface_type in ('indoor', 'outdoor')),
  status        text not null default 'active' check (status in ('active', 'inactive')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_courts_updated
  before update on public.courts
  for each row execute function public.set_updated_at();

create index courts_complex_idx on public.courts (complex_id);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  complex_id       uuid not null references public.complexes (id) on delete restrict,
  court_id         uuid not null references public.courts (id) on delete restrict,
  starts_at        timestamptz not null,
  duration_minutes int not null default 90 check (duration_minutes between 30 and 300),
  max_players      int not null default 4 check (max_players between 2 and 8),
  category         text,
  comments         text,
  status           text not null default 'open'
                   check (status in ('open', 'full', 'cancelled', 'finished')),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_matches_updated
  before update on public.matches
  for each row execute function public.set_updated_at();

create index matches_starts_at_idx on public.matches (starts_at);
create index matches_status_idx on public.matches (status);
create index matches_complex_idx on public.matches (complex_id);

-- ---------------------------------------------------------------------------
-- registrations  (inscripciones + lista de espera en una sola tabla)
-- ---------------------------------------------------------------------------
create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  status      text not null default 'confirmed'
              check (status in ('confirmed', 'waitlist', 'cancelled')),
  position    int,               -- orden en lista de espera (null si confirmado)
  joined_at   timestamptz not null default now(),
  cancelled_at timestamptz
);

-- Un usuario no puede tener dos inscripciones activas al mismo partido.
create unique index registrations_active_unique
  on public.registrations (match_id, user_id)
  where status <> 'cancelled';

create index registrations_match_idx on public.registrations (match_id);
create index registrations_user_idx on public.registrations (user_id);

-- ---------------------------------------------------------------------------
-- notifications  (cola de envios: confirmaciones y recordatorios)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  match_id      uuid references public.matches (id) on delete cascade,
  type          text not null
                check (type in ('registration_confirmed', 'waitlist_promoted',
                                'match_cancelled', 'removed_by_admin',
                                'reminder_24h', 'reminder_2h')),
  channel       text not null default 'push' check (channel in ('push', 'sms', 'whatsapp')),
  title         text not null,
  body          text not null,
  data          jsonb not null default '{}'::jsonb,
  status        text not null default 'pending'
                check (status in ('pending', 'sent', 'failed')),
  scheduled_for timestamptz not null default now(),
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

create index notifications_pending_idx
  on public.notifications (scheduled_for)
  where status = 'pending';

-- Evita duplicar recordatorios para un mismo partido/usuario/tipo.
create unique index notifications_reminder_unique
  on public.notifications (match_id, user_id, type)
  where type in ('reminder_24h', 'reminder_2h');

-- ---------------------------------------------------------------------------
-- push_subscriptions  (Web Push)
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- app_settings  (Configuracion — key/value)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger trg_app_settings_updated
  before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.app_settings (key, value) values
  ('waitlist_enabled', 'true'::jsonb),
  ('reminders_enabled', 'true'::jsonb),
  ('default_duration_minutes', '90'::jsonb),
  ('default_max_players', '4'::jsonb);
