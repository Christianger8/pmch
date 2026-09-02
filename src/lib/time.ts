/**
 * Argentina no usa horario de verano: el offset es -03:00 todo el año.
 * Estas funciones convierten entre el valor de un <input type="datetime-local">
 * (hora local de Argentina) y un ISO en UTC para guardar en la base.
 */
const AR_OFFSET = "-03:00";

/** "2026-01-15T20:00" (hora AR)  ->  "2026-01-15T23:00:00.000Z" */
export function localArgToUtcISO(localValue: string): string {
  const normalized = localValue.length === 16 ? `${localValue}:00` : localValue;
  const date = new Date(`${normalized}${AR_OFFSET}`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha invalida");
  }
  return date.toISOString();
}

/** "2026-01-15T23:00:00Z" -> "2026-01-15T20:00" para precargar el input */
export function utcISOToLocalArg(iso: string): string {
  const d = new Date(iso);
  const ar = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return ar.toISOString().slice(0, 16);
}
