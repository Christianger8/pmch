-- ============================================================================
-- PadelMatch · Endurece permisos de funciones (hallazgos del linter de Supabase)
-- ============================================================================
-- Por defecto Postgres otorga EXECUTE a PUBLIC en toda funcion nueva, lo que
-- las deja llamables desde /rest/v1/rpc/<funcion> por cualquiera, incluido un
-- visitante sin sesion (rol "anon"). Revocar el permiso a los roles concretos
-- (anon, authenticated) NO alcanza: el grant implicito a PUBLIC sigue
-- otorgando el acceso igual. Hay que revocarselo a PUBLIC y, donde haga
-- falta, devolverselo explicitamente a "authenticated".
-- ============================================================================

alter function public.set_updated_at() set search_path = public;

-- Puramente internas: ninguna policy de RLS ni server action las llama por
-- REST. Las siguen usando por dentro las funciones SECURITY DEFINER que las
-- invocan (join_match, run_reminders_tick, el trigger de auth.users...),
-- porque esas llamadas corren con los privilegios de su dueno.
revoke execute on function public.recalc_match_status(uuid) from public;
revoke execute on function public.enqueue_due_reminders() from public;
revoke execute on function public.run_reminders_tick() from public;
revoke execute on function public.handle_new_user() from public;

-- Las usan las policies de RLS o los server actions de la app para usuarios
-- ya logueados: se les saca el acceso a "anon"/PUBLIC pero se mantiene para
-- "authenticated".
revoke execute on function public.is_admin(uuid) from public;
grant  execute on function public.is_admin(uuid) to authenticated;

revoke execute on function public.is_complex_admin(uuid, uuid) from public;
grant  execute on function public.is_complex_admin(uuid, uuid) to authenticated;

revoke execute on function public.join_match(uuid) from public;
grant  execute on function public.join_match(uuid) to authenticated;

revoke execute on function public.leave_match(uuid) from public;
grant  execute on function public.leave_match(uuid) to authenticated;

revoke execute on function public.cancel_match(uuid) from public;
grant  execute on function public.cancel_match(uuid) to authenticated;

revoke execute on function public.finish_match(uuid) from public;
grant  execute on function public.finish_match(uuid) to authenticated;

revoke execute on function public.admin_remove_player(uuid, uuid) from public;
grant  execute on function public.admin_remove_player(uuid, uuid) to authenticated;

revoke execute on function public.admin_dashboard_stats() from public;
grant  execute on function public.admin_dashboard_stats() to authenticated;
