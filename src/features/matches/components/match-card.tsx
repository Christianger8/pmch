import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MatchStatusBadge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/format";
import { spotsLeft } from "@/core/domain/match";
import type { MatchDetails } from "@/lib/supabase/database.types";

export function MatchCard({
  match,
  relationBadge,
}: {
  match: MatchDetails;
  relationBadge?: string;
}) {
  const left = spotsLeft(match);

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card className="transition-shadow active:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold leading-tight">{match.complex_name}</p>
            <p className="text-sm text-neutral-500">
              {match.court_name} · {match.court_surface_type === "indoor" ? "Indoor" : "Outdoor"}
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-400">
            <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" />
          </svg>
          <span className="font-medium capitalize">{formatDate(match.starts_at)}</span>
          <span className="text-neutral-400">·</span>
          <span className="font-medium">{formatTime(match.starts_at)} hs</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayerDots confirmed={match.confirmed_count} max={match.max_players} />
            <span className="text-sm font-medium">
              {match.confirmed_count}/{match.max_players} jugadores
            </span>
          </div>
          <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            {relationBadge
              ? relationBadge
              : left <= 0
                ? "Completo"
                : left === 1
                  ? "Queda 1 lugar"
                  : `Quedan ${left} lugares`}
          </span>
        </div>

        {match.category && (
          <p className="mt-2 text-xs text-neutral-400">Categoria {match.category}</p>
        )}
      </Card>
    </Link>
  );
}

function PlayerDots({ confirmed, max }: { confirmed: number; max: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={
            i < confirmed
              ? "h-2.5 w-2.5 rounded-full bg-brand-500"
              : "h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700"
          }
        />
      ))}
    </div>
  );
}
