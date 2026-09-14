import { requireUser } from "@/features/auth/session";
import { getMyRelations, listCities, listMatches } from "@/features/matches/queries";
import { listComplexes } from "@/features/admin/queries";
import { MatchCard } from "@/features/matches/components/match-card";
import { MatchFilters } from "@/features/matches/components/filters";
import { RealtimeRefresh } from "@/features/matches/components/realtime-refresh";

export const metadata = { title: "Partidos disponibles" };

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; complex?: string; date?: string; available?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const [matches, cities, complexes, relByMatch] = await Promise.all([
    listMatches({
      city: sp.city,
      complexId: sp.complex,
      date: sp.date,
      onlyAvailable: sp.available === "1",
    }),
    listCities(),
    listComplexes(),
    getMyRelations(user.id),
  ]);

  return (
    <div className="space-y-4">
      <RealtimeRefresh />
      <div>
        <h1 className="text-xl font-bold">Partidos disponibles</h1>
        <p className="text-sm text-neutral-500">Elegi uno y anotate.</p>
      </div>

      <MatchFilters
        cities={cities}
        complexes={complexes
          .filter((c) => c.status === "active")
          .map((c) => ({ id: c.id, name: c.name }))}
      />

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No hay partidos con estos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => {
            const rel = relByMatch.get(m.id);
            return (
              <MatchCard
                key={m.id}
                match={m}
                relationBadge={
                  rel === "confirmed" ? "Anotado" : rel === "waitlist" ? "En espera" : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
