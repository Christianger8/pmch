-- ============================================================================
-- PadelMatch · Programacion de recordatorios
-- ============================================================================
-- Genera notificaciones pendientes (reminder_24h / reminder_2h) para los
-- partidos proximos y deja que la Edge Function `reminders` las despache.
--
-- Requiere las extensiones pg_cron y pg_net (habilitadas desde el dashboard:
-- Database -> Extensions). En local ya vienen con la imagen de Supabase.
-- ============================================================================

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Encola recordatorios que correspondan segun la ventana de tiempo.
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_due_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int := 0;
  reminders_on boolean;
begin
  select coalesce((value)::boolean, true) into reminders_on
  from public.app_settings where key = 'reminders_enabled';
  if not coalesce(reminders_on, true) then
    return 0;
  end if;

  -- 24 horas antes (ventana de 30 min para tolerar el intervalo del cron)
  with due as (
    insert into public.notifications (user_id, match_id, type, channel, title, body, scheduled_for)
    select r.user_id, m.id, 'reminder_24h', 'whatsapp',
           'Manana tenes partido',
           'Recorda tu partido de padel manana. Toca para ver los detalles.',
           now()
    from public.matches m
    join public.registrations r on r.match_id = m.id and r.status = 'confirmed'
    where m.status in ('open', 'full')
      and m.starts_at between now() + interval '23 hours 45 minutes'
                          and now() + interval '24 hours 15 minutes'
    on conflict do nothing
    returning 1
  )
  select count(*) into inserted from due;

  -- 2 horas antes
  with due as (
    insert into public.notifications (user_id, match_id, type, channel, title, body, scheduled_for)
    select r.user_id, m.id, 'reminder_2h', 'whatsapp',
           'Tu partido es en 2 horas',
           'Tu partido de padel empieza en 2 horas. Nos vemos en la cancha.',
           now()
    from public.matches m
    join public.registrations r on r.match_id = m.id and r.status = 'confirmed'
    where m.status in ('open', 'full')
      and m.starts_at between now() + interval '1 hour 45 minutes'
                          and now() + interval '2 hours 15 minutes'
    on conflict do nothing
    returning 1
  )
  select inserted + count(*) into inserted from due;

  return inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cron cada 15 minutos: encola y luego invoca la Edge Function para despachar.
-- ---------------------------------------------------------------------------
-- Sustituir <PROJECT_REF> y <REMINDERS_CRON_SECRET> al aplicar en produccion,
-- o setear estos valores como GUC del proyecto (ver docs/DEPLOYMENT.md).
select cron.schedule(
  'padel-reminders',
  '*/15 * * * *',
  $$
  select public.enqueue_due_reminders();
  select net.http_post(
    url     := current_setting('app.settings.reminders_function_url', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.reminders_cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
