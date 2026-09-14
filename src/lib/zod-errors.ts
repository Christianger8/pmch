/** Convierte errores de Zod en un mapa { campo: primer mensaje } para mostrar en formularios. */
export function zodToFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.length ? String(i.path[0]) : "_";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
