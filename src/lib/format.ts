const TZ = "America/Argentina/Buenos_Aires";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const shortFmt = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export function formatDate(iso: string): string {
  return capitalize(dateFmt.format(new Date(iso)));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTimeShort(iso: string): string {
  return capitalize(shortFmt.format(new Date(iso)));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function endTime(startIso: string, durationMinutes: number): Date {
  return new Date(new Date(startIso).getTime() + durationMinutes * 60_000);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Normaliza un telefono ingresado a formato E.164 aproximado para Argentina.
 * Acepta "+5491122334455", "11 2233-4455", "0111533334444", etc.
 * No valida operador; solo limpia y antepone el prefijo pais.
 */
export function normalizePhone(input: string, defaultCountry = "54"): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  digits = digits.replace(/\D/g, "");
  digits = digits.replace(/^0/, "");
  digits = digits.replace(/^(\d{2,4})15/, "$1"); // saca el "15" de celular
  if (!digits.startsWith(defaultCountry)) digits = defaultCountry + digits;
  return "+" + digits;
}

export function isValidPhone(e164: string): boolean {
  return /^\+\d{10,15}$/.test(e164);
}
