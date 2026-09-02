// Edge Function: despacha las notificaciones pendientes (recordatorios y avisos).
//
// La invoca pg_cron cada 15 min (ver migracion 20260101000300_cron.sql) con:
//   Authorization: Bearer <REMINDERS_CRON_SECRET>
//
// Deploy:  supabase functions deploy reminders
// Secrets: supabase secrets set REMINDERS_CRON_SECRET=... NOTIFY_PROVIDER=twilio ...

import { createClient } from "jsr:@supabase/supabase-js@2";
import { dispatch } from "../_shared/notify.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("REMINDERS_CRON_SECRET")!;

const BATCH = 100;

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: pending, error } = await supabase
    .from("notifications")
    .select("id, user_id, channel, title, body, profile:profiles(phone)")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(BATCH);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const n of pending ?? []) {
    const phone = (n as { profile?: { phone?: string } }).profile?.phone;
    if (!phone) {
      await supabase
        .from("notifications")
        .update({ status: "failed", error: "sin telefono" })
        .eq("id", n.id);
      failed++;
      continue;
    }

    const result = await dispatch({
      to: phone,
      channel: n.channel as "sms" | "whatsapp" | "push",
      title: n.title,
      body: n.body,
    });

    await supabase
      .from("notifications")
      .update(
        result.ok
          ? { status: "sent", sent_at: new Date().toISOString(), error: null }
          : { status: "failed", error: result.error ?? "error desconocido" },
      )
      .eq("id", n.id);

    result.ok ? sent++ : failed++;
  }

  return Response.json({ processed: (pending ?? []).length, sent, failed });
});
