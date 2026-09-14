-- ============================================================================
-- PadelMatch · Chequeo de celular antes de loguearse
-- ============================================================================
-- El login nuevo primero pregunta el celular y recien pide el canal
-- (WhatsApp/SMS) si el numero todavia no esta registrado. Esa consulta la
-- hace un visitante SIN sesion (rol "anon"), y las policies de "profiles"
-- solo dejan leer a "authenticated" -- por eso una funcion chica que solo
-- devuelve si existe o no, sin exponer ningun dato del perfil.
-- ============================================================================

create or replace function public.phone_is_registered(check_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where phone = check_phone);
$$;

revoke execute on function public.phone_is_registered(text) from public;
grant execute on function public.phone_is_registered(text) to anon, authenticated;
