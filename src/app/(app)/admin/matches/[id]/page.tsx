import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, getMatchPlayers } from "@/features/matches/queries";
import { Card } from "@/components/ui/card";
import { Badge, MatchStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  MatchAdminActions,
  RemovePlayerButton,
} from "@/features/admin/components/match-admin-actions";
import { RealtimeRefresh } from "@/features/matches/components/realtime-refresh";
import { formatDate, formatDuration, formatTime } from "@/lib/format";

export const metadata = { title: "Detalle del partido" };

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, players] = await Promise.all([getMatch(id), getMatchPlayers(id)]);
  if (!match) notFound();

  const confirmed = players.filter((p) => p.registration.status === "confirmed");
  const waitlist = players.filter((p) => p.registration.status === "waitlist");
  const editable = match.status === "open" || match.status === "full";

  return (
    <div className="space-y-4">
      <RealtimeRefresh matchId={id} />

      <Card className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold">
              {match.complex_name} · {match.court_name}
            </h1>
            <p className="text-sm text-neutral-500">
              <span className="capitalize">{formatDate(match.starts_at)}</span> · {formatTime(match.starts_at)} hs ·{" "}
              {formatDuration(match.duration_minutes)}
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="text-sm text-neutral-500">
          {match.confirmed_count}/{match.max_players} jugadores
          {match.category && ` · Categoria ${match.category}`}
        </div>
        {match.comments && (
          <p className="rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800">{match.comments}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {editable && (
            <ButtonLink href={`/admin/matches/${id}/edit`} variant="secondary" size="sm">
              Editar
            </ButtonLink>
          )}
          <MatchAdminActions matchId={id} status={match.status} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">
          Inscriptos ({confirmed.length}/{match.max_players})
        </h2>
        {confirmed.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavia no se anoto nadie.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {confirmed.map((p) => (
              <li key={p.registration.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.profile.full_name ?? "Jugador"}</p>
                  <p className="text-xs text-neutral-400">{p.profile.phone}</p>
                </div>
                {editable && (
                  <RemovePlayerButton
                    matchId={id}
                    userId={p.profile.id}
                    playerName={p.profile.full_name ?? "el jugador"}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {waitlist.length > 0 && (
          <>
            <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-500">
              Lista de espera <Badge tone="amber">{waitlist.length}</Badge>
            </h3>
            <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
              {waitlist.map((p, i) => (
                <li key={p.registration.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">
                    {i + 1}. {p.profile.full_name ?? "Jugador"}
                  </span>
                  {editable && (
                    <RemovePlayerButton
                      matchId={id}
                      userId={p.profile.id}
                      playerName={p.profile.full_name ?? "el jugador"}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Link href="/admin/matches" className="block text-center text-sm text-neutral-500 underline">
        Volver a partidos
      </Link>
    </div>
  );
}
