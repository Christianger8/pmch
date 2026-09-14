-- ============================================================================
-- Partidup · Los jugadores tambien pueden organizar sus propios partidos
-- ============================================================================
-- Antes solo el admin (global o de complejo) podia crear/editar/cancelar
-- partidos. Ahora cualquier usuario autenticado puede crear uno (queda
-- como organizador en matches.created_by) y despues editarlo/cancelarlo/
-- finalizarlo -- ademas del admin, que sigue pudiendo gestionar cualquier
-- partido de los complejos que administra.
-- ============================================================================

-- Cualquier autenticado puede crear un partido, siempre a su propio nombre
-- (no puede insertar uno con created_by de otra persona).
create policy "matches: authenticated insert own"
  on public.matches for insert to authenticated
  with check (created_by = auth.uid());

-- El organizador puede editar los datos de su propio partido (complejo,
-- cancha, horario, cupo, etc). La policy "matches: admin write" ya
-- existente sigue cubriendo al admin sobre cualquier partido.
create policy "matches: organizer update own"
  on public.matches for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- cancel_match / finish_match: permitir tambien al organizador del
-- partido, no solo al admin del complejo.
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
  if not (public.is_complex_admin(m.complex_id) or m.created_by = auth.uid()) then
    raise exception 'FORBIDDEN';
  end if;

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
  if not (public.is_complex_admin(m.complex_id) or m.created_by = auth.uid()) then
    raise exception 'FORBIDDEN';
  end if;

  update public.matches set status = 'finished' where id = target_match;
end;
$$;

-- Nota: create or replace function conserva los grants ya otorgados
-- (20260101000500_harden_function_grants.sql ya dio EXECUTE en estas dos
-- funciones a "authenticated"), no hace falta volver a otorgarlos.
