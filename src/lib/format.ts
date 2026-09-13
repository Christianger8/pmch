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
 * Arma el E.164 de un celular argentino a partir de SOLO el codigo de area +
 * numero (lo unico que pide el formulario de login: el "+54 9" va fijo en la
 * UI). Acepta "11 2233-4455", "0291 6493400", "291-15-649-3400", etc.
 */
export function argMobileToE164(localNumber: string): string {
  let digits = localNumber.replace(/\D/g, "");
  digits = digits.replace(/^0/, ""); // codigo de area con 0 inicial (ej. "011")
  digits = digits.replace(/^(\d{2,4})15/, "$1"); // "15" de celular antiguo
  return `+549${digits}`;
}

export function isValidPhone(e164: string): boolean {
  return /^\+\d{10,15}$/.test(e164);
}
