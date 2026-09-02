import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import {
  getMatch,
  getMatchPlayers,
  getViewerRegistration,
  getWaitlistEnabled,
} from "@/features/matches/queries";
import { Card } from "@/components/ui/card";
import { MatchStatusBadge } from "@/components/ui/badge";
import { JoinButton } from "@/features/matches/components/join-button";
import { ShareButtons } from "@/features/matches/components/share-buttons";
import { AddToCalendar } from "@/features/matches/components/add-to-calendar";
import { RealtimeRefresh } from "@/features/matches/components/realtime-refresh";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { resolveActionState, spotsLeft, statusLabel } from "@/core/domain/match";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) return { title: "Partido" };
  return {
    title: `${match.complex_name} · ${formatDate(match.starts_at)}`,
    description: `${match.court_name} · ${formatTime(match.starts_at)} hs · ${spotsLeft(match)} lugares`,
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [match, players, viewerReg, waitlistEnabled] = await Promise.all([
    getMatch(id),
    getMatchPlayers(id),
    getViewerRegistration(id, user.id),
    getWaitlistEnabled(),
  ]);

  if (!match) notFound();

  const relation = viewerReg?.status === "confirmed" ? "confirmed" : viewerReg?.status === "waitlist" ? "waitlist" : "none";
  const actionState = resolveActionState(match, relation, waitlistEnabled);
  const confirmed = players.filter((p) => p.registration.status === "confirmed");
  const waitlist = players.filter((p) => p.registration.status === "waitlist");
  const isRegistered = relation !== "none";

  return (
    <div className="space-y-4">
      <RealtimeRefresh matchId={id} />

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{match.complex_name}</h1>
            <p className="text-neutral-500">
              {match.court_name} · {match.court_surface_type === "indoor" ? "Indoor" : "Outdoor"}
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="Fecha" value={<span className="capitalize">{formatDate(match.starts_at)}</span>} />
          <Info label="Hora" value={`${formatTime(match.starts_at)} hs`} />
          <Info label="Duracion" value={formatDuration(match.duration_minutes)} />
          <Info label="Lugares" value={`${match.confirmed_count}/${match.max_players}`} />
          {match.category && <Info label="Categoria" value={match.category} />}
          {match.complex_address && <Info label="Direccion" value={match.complex_address} />}
        </dl>

        {match.comments && (
          <p className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
            {match.comments}
          </p>
        )}

        <p className="mt-3 text-sm font-semibold text-brand-600 dark:text-brand-400">
          {statusLabel(match.status)}
        </p>
      </Card>

      <div className="space-y-2">
        <JoinButton matchId={id} actionState={actionState} size="lg" />
        {isRegistered && <AddToCalendar matchId={id} />}
        <ShareButtons match={match} />
      </div>

      <Card>
        <h2 className="font-semibold">Jugadores anotados ({confirmed.length}/{match.max_players})</h2>
        <ul className="mt-3 space-y-2">
          {confirmed.map((p) => (
            <li key={p.registration.id} className="flex items-center gap-3">
              <Avatar name={p.profile.full_name} />
              <span className="text-sm">
                {p.profile.full_name ?? "Jugador"}
                {p.profile.id === user.id && <span className="text-neutral-400"> (vos)</span>}
              </span>
            </li>
          ))}
          {Array.from({ length: Math.max(match.max_players - confirmed.length, 0) }).map((_, i) => (
            <li key={`empty-${i}`} className="flex items-center gap-3 text-neutral-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-neutral-300 dark:border-neutral-600">
                +
              </span>
              <span className="text-sm">Lugar libre</span>
            </li>
          ))}
        </ul>

        {waitlist.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-neutral-500">Lista de espera</h3>
            <ol className="mt-2 space-y-1 text-sm text-neutral-500">
              {waitlist.map((p, i) => (
                <li key={p.registration.id}>
                  {i + 1}. {p.profile.full_name ?? "Jugador"}
                  {p.profile.id === user.id && " (vos)"}
                </li>
              ))}
            </ol>
          </>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
      {initials}
    </span>
  );
}
