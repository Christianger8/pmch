-- ============================================================================
-- PadelMatch · Row Level Security
-- ============================================================================
-- Regla general:
--   * Lectura: cualquier usuario autenticado ve complejos, canchas, partidos
--     e inscripciones (para mostrar quien juega).
--   * Escritura de catalogo (complejos/canchas/partidos): admin global o
--     admin del complejo.
--   * Inscripciones: se gestionan por RPC (SECURITY DEFINER). Ademas se permite
--     al usuario leer/cancelar las propias como red de seguridad.
-- ============================================================================

-- Las vistas aplican RLS de las tablas subyacentes (PG15+).
alter view public.match_details set (security_invoker = on);
alter view public.player_history set (security_invoker = on);

alter table public.profiles          enable row level security;
alter table public.complexes         enable row level security;
alter table public.complex_admins    enable row level security;
alter table public.courts            enable row level security;
alter table public.matches           enable row level security;
alter table public.registrations     enable row level security;
alter table public.notifications     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.app_settings      enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'player'); -- no auto-promocion a admin

create policy "profiles: admin update any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- complexes
-- ---------------------------------------------------------------------------
create policy "complexes: read authenticated"
  on public.complexes for select to authenticated using (true);

create policy "complexes: admin insert"
  on public.complexes for insert to authenticated
  with check (public.is_admin());

create policy "complexes: admin update"
  on public.complexes for update to authenticated
  using (public.is_complex_admin(id)) with check (public.is_complex_admin(id));

create policy "complexes: admin delete"
  on public.complexes for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- complex_admins
-- ---------------------------------------------------------------------------
create policy "complex_admins: read admin"
  on public.complex_admins for select to authenticated
  using (public.is_admin() or user_id = auth.uid());

create policy "complex_admins: manage by global admin"
  on public.complex_admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- courts
-- ---------------------------------------------------------------------------
create policy "courts: read authenticated"
  on public.courts for select to authenticated using (true);

create policy "courts: admin write"
  on public.courts for all to authenticated
  using (public.is_complex_admin(complex_id))
  with check (public.is_complex_admin(complex_id));

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create policy "matches: read authenticated"
  on public.matches for select to authenticated using (true);

create policy "matches: admin write"
  on public.matches for all to authenticated
  using (public.is_complex_admin(complex_id))
  with check (public.is_complex_admin(complex_id));

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------
create policy "registrations: read authenticated"
  on public.registrations for select to authenticated using (true);

create policy "registrations: user cancels own"
  on public.registrations for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "registrations: admin write"
  on public.registrations for all to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = registrations.match_id and public.is_complex_admin(m.complex_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = registrations.match_id and public.is_complex_admin(m.complex_id)
    )
  );

-- ---------------------------------------------------------------------------
-- notifications  (solo lectura de las propias; escritura via service role / RPC)
-- ---------------------------------------------------------------------------
create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------
create policy "push: manage own"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- app_settings  (lectura todos; escritura admin)
-- ---------------------------------------------------------------------------
create policy "settings: read authenticated"
  on public.app_settings for select to authenticated using (true);

create policy "settings: admin write"
  on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
