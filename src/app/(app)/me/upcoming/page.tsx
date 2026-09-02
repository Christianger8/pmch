import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { getWaitlistEnabled, listMyUpcomingMatches } from "@/features/matches/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JoinButton } from "@/features/matches/components/join-button";
import { ShareButtons } from "@/features/matches/components/share-buttons";
import { AddToCalendar } from "@/features/matches/components/add-to-calendar";
import { RealtimeRefresh } from "@/features/matches/components/realtime-refresh";
import { formatDate, formatTime } from "@/lib/format";
import { resolveActionState } from "@/core/domain/match";

export const metadata = { title: "Proximos partidos" };

export default async function UpcomingPage() {
  const user = await requireUser();
  const [items, waitlistEnabled] = await Promise.all([
    listMyUpcomingMatches(user.id),
    getWaitlistEnabled(),
  ]);

  return (
    <div className="space-y-4">
      <RealtimeRefresh />
      <h1 className="text-xl font-bold">Proximos partidos</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No tenes partidos proximos.{" "}
          <Link href="/" className="text-brand-600 underline">
            Ver disponibles
          </Link>
        </div>
      ) : (
        items.map(({ match, registration }) => {
          const relation = registration.status === "confirmed" ? "confirmed" : "waitlist";
          return (
            <Card key={match.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <Link href={`/matches/${match.id}`}>
                  <p className="font-semibold">{match.complex_name}</p>
                  <p className="text-sm text-neutral-500">
                    {match.court_name} · <span className="capitalize">{formatDate(match.starts_at)}</span> · {formatTime(match.starts_at)} hs
                  </p>
                </Link>
                <Badge tone={registration.status === "confirmed" ? "green" : "amber"}>
                  {registration.status === "confirmed" ? "Confirmado" : `Espera #${registration.position ?? "?"}`}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <JoinButton
                  matchId={match.id}
                  actionState={resolveActionState(match, relation, waitlistEnabled)}
                  size="sm"
                />
                <AddToCalendar matchId={match.id} />
              </div>
              <ShareButtons match={match} />
            </Card>
          );
        })
      )}
    </div>
  );
}
