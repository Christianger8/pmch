import { createHmac } from "node:crypto";
import { playerAutoLoginSecret } from "@/lib/env";

/**
 * Contrasena determinista para el login sin OTP de jugadores que un admin
 * cargo a mano (mientras no hay WhatsApp/SMS conectado). Se deriva del
 * celular + un secreto que solo vive en el servidor (PLAYER_AUTO_LOGIN_SECRET):
 * nadie la escribe ni la ve, se recalcula igual al crear el jugador y al
 * loguearlo.
 *
 * OJO — esto es un atajo temporal: cualquiera que sepa el celular de un
 * jugador cargado puede entrar como esa persona, sin confirmar que el
 * telefono es realmente suyo. Pensado para un grupo chico de confianza
 * mientras se arranca sin Twilio. El dia que se conecte WhatsApp/SMS,
 * volver al login por OTP real (ver login-form.tsx / checkPhone).
 */
export function derivePlayerPassword(phone: string): string {
  return createHmac("sha256", playerAutoLoginSecret()).update(phone).digest("hex");
}
