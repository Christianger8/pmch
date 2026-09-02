// Proveedor de mensajeria pluggable para la Edge Function de recordatorios.
// NOTIFY_PROVIDER = "log" (default) escribe en consola; "twilio" envia SMS/WhatsApp.

export interface OutboundMessage {
  to: string; // telefono E.164 del destinatario
  channel: "sms" | "whatsapp" | "push";
  title: string;
  body: string;
}

export interface NotifyResult {
  ok: boolean;
  error?: string;
}

const provider = Deno.env.get("NOTIFY_PROVIDER") ?? "log";

export async function dispatch(msg: OutboundMessage): Promise<NotifyResult> {
  if (msg.channel === "push") {
    // El envio Web Push real requiere las VAPID keys; se resuelve en otra iteracion.
    console.log("[push:skipped]", msg.title, "->", msg.to);
    return { ok: true };
  }

  if (provider === "twilio") {
    return sendViaTwilio(msg);
  }

  console.log(`[${msg.channel}:log] -> ${msg.to} :: ${msg.title} — ${msg.body}`);
  return { ok: true };
}

async function sendViaTwilio(msg: OutboundMessage): Promise<NotifyResult> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return { ok: false, error: "Faltan credenciales de Twilio" };

  const from =
    msg.channel === "whatsapp"
      ? Deno.env.get("TWILIO_WHATSAPP_FROM")
      : Deno.env.get("TWILIO_SMS_FROM");
  if (!from) return { ok: false, error: `Falta el remitente para ${msg.channel}` };

  const to = msg.channel === "whatsapp" ? `whatsapp:${msg.to}` : msg.to;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: `${msg.title}\n${msg.body}` }),
    },
  );

  if (!res.ok) {
    return { ok: false, error: `Twilio ${res.status}: ${await res.text()}` };
  }
  return { ok: true };
}
