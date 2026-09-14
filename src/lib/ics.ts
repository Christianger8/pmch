import { env } from "@/lib/env";
import type { MatchDetails } from "@/lib/supabase/database.types";

/** Formatea una fecha a UTC en el formato de iCalendar: 20260115T230000Z */
function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Corta las lineas a 75 octetos segun RFC 5545. */
function fold(line: string): string {
  const chunks: string[] = [];
  let current = line;
  while (current.length > 75) {
    chunks.push(current.slice(0, 75));
    current = " " + current.slice(75);
  }
  chunks.push(current);
  return chunks.join("\r\n");
}

/**
 * Genera un archivo .ics compatible con Google / Apple / Outlook / Samsung.
 */
export function buildMatchICS(match: MatchDetails): string {
  const start = new Date(match.starts_at);
  const end = new Date(start.getTime() + match.duration_minutes * 60_000);
  const now = new Date();

  const location = [match.complex_name, match.court_name, match.complex_address, match.complex_city]
    .filter(Boolean)
    .join(", ");

  const descriptionParts = [
    `Complejo: ${match.complex_name}`,
    `Cancha: ${match.court_name}`,
    match.category ? `Categoria: ${match.category}` : null,
    match.comments ? `Observaciones: ${match.comments}` : null,
    `Ver partido: ${env.appUrl}/matches/${match.id}`,
  ].filter(Boolean) as string[];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Partidup//ES//",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:match-${match.id}@partidup`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    fold(`SUMMARY:${escapeText(`Padel · ${match.complex_name} · ${match.court_name}`)}`),
    fold(`DESCRIPTION:${escapeText(descriptionParts.join("\n"))}`),
    fold(`LOCATION:${escapeText(location)}`),
    `URL:${env.appUrl}/matches/${match.id}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu partido de padel es en 2 horas",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

export function icsFilename(match: MatchDetails): string {
  const d = new Date(match.starts_at).toISOString().slice(0, 10);
  return `padel-${d}-${match.court_name.toLowerCase().replace(/\s+/g, "-")}.ics`;
}
