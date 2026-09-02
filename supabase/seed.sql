-- ============================================================================
-- PadelMatch · Datos de ejemplo (solo desarrollo local: `supabase db reset`)
-- ============================================================================
-- Crea un usuario admin y algunos complejos/canchas/partidos de muestra.
-- Telefono admin: +54 9 11 0000 0000  ·  OTP de test: 123456 (ver config.toml)
-- ============================================================================

-- Usuario admin en auth.users (el trigger crea el profile).
-- Nota: si tu version del schema `auth` rechaza este insert, omitilo: entra a la
-- app con tu celular y luego corre  update public.profiles set role='admin' ...
insert into auth.users (id, phone, phone_confirmed_at, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-000000000001',
  '5491100000000',
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"phone","providers":["phone"]}', '{}'
)
on conflict (id) do nothing;

update public.profiles
set role = 'admin', full_name = 'Admin PadelMatch', onboarded = true
where id = '00000000-0000-0000-0000-000000000001';

-- Complejos
insert into public.complexes (id, name, address, city, province, status, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Club Norte', 'Av. Libertador 1234', 'Buenos Aires', 'CABA', 'active', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Padel Sur',  'Calle Falsa 456',     'La Plata',     'Buenos Aires', 'active', '00000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- Canchas
insert into public.courts (id, complex_id, name, surface_type, status, notes) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cancha 1', 'indoor',  'active', 'Techada, cristal panoramico'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Cancha 3', 'outdoor', 'active', null),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Cancha A', 'indoor',  'active', null)
on conflict do nothing;

-- Partidos (proximos)
insert into public.matches (id, complex_id, court_id, starts_at, duration_minutes, max_players, category, comments, status, created_by) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   date_trunc('hour', now()) + interval '2 days' + interval '20 hours' - interval '1 hour' * extract(hour from now()),
   90, 4, '4ta', 'Partido amistoso', 'open', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003',
   date_trunc('hour', now()) + interval '3 days' + interval '19 hours' - interval '1 hour' * extract(hour from now()),
   90, 4, '6ta', null, 'open', '00000000-0000-0000-0000-000000000001')
on conflict do nothing;
