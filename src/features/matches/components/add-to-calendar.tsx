import { ButtonLink } from "@/components/ui/button";

/** Descarga el .ics generado por el route handler. */
export function AddToCalendar({ matchId }: { matchId: string }) {
  return (
    <ButtonLink href={`/api/matches/${matchId}/ics`} variant="outline" prefetch={false}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18M12 14v4M10 16h4" />
      </svg>
      Agregar al calendario
    </ButtonLink>
  );
}
