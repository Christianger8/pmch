import { env } from "@/lib/env";
import { formatDate, formatTime } from "@/lib/format";
import { spotsLeft } from "@/core/domain/match";
import type { MatchDetails } from "@/lib/supabase/database.types";

/**
 * Arma el mensaje para invitar jugadores por WhatsApp.
 *
 *   "Estoy organizando un partido de padel.
 *    Viernes 20:00 hs
 *    Club Norte - Cancha 3
 *    Todavia quedan 2 lugares.
 *    Te sumas?
 *    https://midominio.com/matches/123"
 */
export function buildWhatsAppMessage(match: MatchDetails): string {
  const left = spotsLeft(match);
  const spotsLine =
    left <= 0
      ? "El partido esta completo, pero podes anotarte en la lista de espera."
      : left === 1
        ? "Queda 1 lugar."
        : `Todavia quedan ${left} lugares.`;

  return [
    "Estoy organizando un partido de padel.",
    `${formatDate(match.starts_at)} ${formatTime(match.starts_at)} hs`,
    `${match.complex_name} - ${match.court_name}`,
    spotsLine,
    "Te sumas?",
    `${env.appUrl}/matches/${match.id}`,
  ].join("\n");
}

/** URL universal wa.me con el texto ya codificado. */
export function buildWhatsAppShareUrl(match: MatchDetails): string {
  return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(match))}`;
}
