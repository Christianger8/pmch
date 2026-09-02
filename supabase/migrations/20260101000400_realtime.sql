-- ============================================================================
-- PadelMatch · Realtime
-- ============================================================================
-- Expone los cambios de estas tablas por WebSocket para que el cliente
-- refresque los contadores de jugadores en vivo.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.registrations;
exception when duplicate_object then null;
end $$;

-- Realtime respeta RLS: ambas tablas tienen SELECT abierto a authenticated,
-- por lo que los eventos llegan a cualquier usuario logueado (solo el hecho de
-- que "algo cambio", sin datos sensibles).
