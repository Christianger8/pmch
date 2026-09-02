-- ============================================================================
-- PadelMatch · Funciones de dominio (RPC) y vistas
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers de autorizacion
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

create or replace function public.is_complex_admin(target_complex uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(uid)
      or exists (
        select 1 from public.complex_admins ca
        where ca.complex_id = target_complex and ca.user_id = uid
      );
$$;

-- ---------------------------------------------------------------------------
-- Vista: partidos con conteo de jugadores y lugares disponibles
-- ---------------------------------------------------------------------------
create or replace view public.match_details as
select
  m.*,
  c.name  as complex_name,
  c.address as complex_address,
  c.city  as complex_city,
  c.province as complex_province,
  ct.name as court_name,
  ct.surface_type as court_surface_type,
  coalesce(r.confirmed_count, 0)::int as confirmed_count,
  coalesce(r.waitlist_count, 0)::int  as waitlist_count,
  greatest(m.max_players - coalesce(r.confirmed_count, 0), 0)::int as spots_left
from public.matches m
join public.complexes c on c.id = m.complex_id
join public.courts ct   on ct.id = m.court_id
left join lateral (
  select
    count(*) filter (where status = 'confirmed') as confirmed_count,
    count(*) filter (where status = 'waitlist')  as waitlist_count
  from public.registrations
  where match_id = m.id
) r on true;

comment on view public.match_details is 'Partidos enriquecidos para el listado y el detalle.';

-- ---------------------------------------------------------------------------
-- Recalcula match.status (open/full) segun ocupacion. No toca cancelled/finished.
-- ---------------------------------------------------------------------------
create or replace function public.recalc_match_status(target_match uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  confirmed int;
begin
  select * into m from public.matches where id = target_match for update;
  if not found or m.status in ('cancelled', 'finished') then
    return;
  end if;

  select count(*) into confirmed
  from public.registrations
  where match_id = target_match and status = 'confirmed';

  if confirmed >= m.max_players then
    update public.matches set status = 'full' where id = target_match and status <> 'full';
  else
    update public.matches set status = 'open' where id = target_match and status <> 'open';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- join_match: inscribe al usuario actual. Devuelve el estado resultante
-- ('confirmed' | 'waitlist'). Maneja concurrencia con lock del partido.
-- ---------------------------------------------------------------------------
create or replace function public.join_match(target_match uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m record;
  confirmed int;
  existing record;
  waitlist_enabled boolean;
  next_position int;
  result_status text;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into m from public.matches where id = target_match for update;
  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;
  if m.status = 'cancelled' then
    raise exception 'MATCH_CANCELLED';
  end if;
  if m.status = 'finished' or m.starts_at < now() then
    raise exception 'MATCH_ALREADY_STARTED';
  end if;

  select * into existing
  from public.registrations
  where match_id = target_match and user_id = uid and status <> 'cancelled';
  if found then
    return existing.status;
  end if;

  select count(*) into confirmed
  from public.registrations
  where match_id = target_match and status = 'confirmed';

  if confirmed < m.max_players then
    insert into public.registrations (match_id, user_id, status)
    values (target_match, uid, 'confirmed');
    result_status := 'confirmed';
  else
    select coalesce((value)::boolean, true) into waitlist_enabled
    from public.app_settings where key = 'waitlist_enabled';

    if not coalesce(waitlist_enabled, true) then
      raise exception 'MATCH_FULL';
    end if;

    select coalesce(max(position), 0) + 1 into next_position
    from public.registrations
    where match_id = target_match and status = 'waitlist';

    insert into public.registrations (match_id, user_id, status, position)
    values (target_match, uid, 'waitlist', next_position);
    result_status := 'waitlist';
  end if;

  perform public.recalc_match_status(target_match);

  insert into public.notifications (user_id, match_id, type, channel, title, body)
  values (
    uid, target_match,
    case when result_status = 'confirmed' then 'registration_confirmed' else 'waitlist_promoted' end,
    'push',
    case when result_status = 'confirmed' then 'Inscripcion confirmada' else 'Estas en lista de espera' end,
    case when result_status = 'confirmed'
         then 'Quedaste anotado en el partido.'
         else 'El partido esta completo. Te avisamos si se libera un lugar.' end
  );

  return result_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- leave_match: baja al usuario actual y promueve al primero de la lista de espera.
-- ---------------------------------------------------------------------------
create or replace function public.leave_match(target_match uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  reg record;
  promoted record;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into reg from public.matches where id = target_match for update;
  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  update public.registrations
  set status = 'cancelled', cancelled_at = now(), position = null
  where match_id = target_match and user_id = uid and status <> 'cancelled'
  returning * into reg;

  if not found then
    return; -- no estaba inscripto, no-op
  end if;

  -- Si se libero un lugar confirmado, promover al primero en espera.
  if reg.status = 'confirmed' then
    select * into promoted
    from public.registrations
    where match_id = target_match and status = 'waitlist'
    order by position asc nulls last, joined_at asc
    limit 1
    for update;

    if found then
      update public.registrations
      set status = 'confirmed', position = null
      where id = promoted.id;

      insert into public.notifications (user_id, match_id, type, channel, title, body)
      values (promoted.user_id, target_match, 'waitlist_promoted', 'push',
              'Se libero un lugar', 'Pasaste de la lista de espera al partido. Confirmado.');
    end if;
  end if;

  perform public.recalc_match_status(target_match);
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_remove_player: el admin saca a un jugador del partido.
-- ---------------------------------------------------------------------------
create or replace function public.admin_remove_player(target_match uuid, target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  reg record;
  promoted record;
begin
  select * into m from public.matches where id = target_match for update;
  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;
  if not public.is_complex_admin(m.complex_id) then
    raise exception 'FORBIDDEN';
  end if;

  update public.registrations
  set status = 'cancelled', cancelled_at = now(), position = null
  where match_id = target_match and user_id = target_user and status <> 'cancelled'
  returning * into reg;

  if not found then
    return;
  end if;

  insert into public.notifications (user_id, match_id, type, channel, title, body)
  values (target_user, target_match, 'removed_by_admin', 'push',
          'Te quitaron del partido', 'Un administrador te removio de un partido.');

  if reg.status = 'confirmed' then
    select * into promoted
    from public.registrations
    where match_id = target_match and status = 'waitlist'
    order by position asc nulls last, joined_at asc
    limit 1 for update;

    if found then
      update public.registrations set status = 'confirmed', position = null where id = promoted.id;
      insert into public.notifications (user_id, match_id, type, channel, title, body)
      values (promoted.user_id, target_match, 'waitlist_promoted', 'push',
              'Se libero un lugar', 'Pasaste de la lista de espera al partido. Confirmado.');
    end if;
  end if;

  perform public.recalc_match_status(target_match);
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_match / finish_match
-- ---------------------------------------------------------------------------
create or replace function public.cancel_match(target_match uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  select * into m from public.matches where id = target_match for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if not public.is_complex_admin(m.complex_id) then raise exception 'FORBIDDEN'; end if;

  update public.matches set status = 'cancelled' where id = target_match;

  insert into public.notifications (user_id, match_id, type, channel, title, body)
  select r.user_id, target_match, 'match_cancelled', 'push',
         'Partido cancelado', 'Se cancelo un partido en el que estabas anotado.'
  from public.registrations r
  where r.match_id = target_match and r.status <> 'cancelled';
end;
$$;

create or replace function public.finish_match(target_match uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  select * into m from public.matches where id = target_match for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if not public.is_complex_admin(m.complex_id) then raise exception 'FORBIDDEN'; end if;

  update public.matches set status = 'finished' where id = target_match;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vista de historial del jugador
-- ---------------------------------------------------------------------------
create or replace view public.player_history as
select
  r.user_id,
  m.id as match_id,
  m.starts_at,
  m.duration_minutes,
  m.status as match_status,
  r.status as registration_status,
  md.complex_name,
  md.court_name,
  md.complex_city
from public.registrations r
join public.matches m on m.id = r.match_id
join public.match_details md on md.id = m.id
where r.user_id = auth.uid();

-- ---------------------------------------------------------------------------
-- Dashboard admin: metricas agregadas
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'players',            (select count(*) from public.profiles where role = 'player'),
    'complexes',          (select count(*) from public.complexes),
    'complexes_active',   (select count(*) from public.complexes where status = 'active'),
    'courts',             (select count(*) from public.courts),
    'matches_total',      (select count(*) from public.matches),
    'matches_open',       (select count(*) from public.matches where status = 'open'),
    'matches_full',       (select count(*) from public.matches where status = 'full'),
    'matches_cancelled',  (select count(*) from public.matches where status = 'cancelled'),
    'matches_finished',   (select count(*) from public.matches where status = 'finished'),
    'registrations_active',(select count(*) from public.registrations where status <> 'cancelled'),
    'monthly', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select to_char(date_trunc('month', starts_at), 'YYYY-MM') as month,
               count(*) as matches,
               count(*) filter (where status = 'finished') as finished
        from public.matches
        where starts_at > now() - interval '12 months'
        group by 1 order by 1
      ) t
    ),
    'occupancy_by_complex', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select c.name as complex,
               count(distinct m.id) as matches,
               coalesce(round(avg(md.confirmed_count::numeric / nullif(md.max_players, 0)) * 100, 1), 0) as occupancy_pct
        from public.complexes c
        left join public.matches m on m.complex_id = c.id and m.status in ('open','full','finished')
        left join public.match_details md on md.id = m.id
        group by c.name order by c.name
      ) t
    ),
    'occupancy_by_court', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select ct.name as court, c.name as complex,
               count(distinct m.id) as matches,
               coalesce(round(avg(md.confirmed_count::numeric / nullif(md.max_players, 0)) * 100, 1), 0) as occupancy_pct
        from public.courts ct
        join public.complexes c on c.id = ct.complex_id
        left join public.matches m on m.court_id = ct.id and m.status in ('open','full','finished')
        left join public.match_details md on md.id = m.id
        group by ct.name, c.name order by c.name, ct.name
      ) t
    )
  ) into result;

  return result;
end;
$$;
