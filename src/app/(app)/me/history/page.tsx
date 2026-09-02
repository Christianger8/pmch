import { requireUser } from "@/features/auth/session";
import { getPlayerHistory } from "@/features/matches/queries";
import { Card, Stat } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeShort } from "@/lib/format";

export const metadata = { title: "Mi historial" };

export default async function HistoryPage() {
  const user = await requireUser();
  const { rows, stats } = await getPlayerHistory(user.id);

  const played = rows.filter(
    (r) =>
      r.registration_status !== "cancelled" &&
      (r.match_status === "finished" || new Date(r.starts_at).getTime() < Date.now()),
  );

  const topComplex = Object.entries(stats.byComplex).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mi historial</h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Partidos jugados" value={stats.played} />
        <Stat label="Proximos" value={stats.upcoming} />
        <Stat label="Cancelados" value={stats.cancelled} />
        <Stat label="Complejo habitual" value={topComplex ? topComplex[0] : "—"} />
      </div>

      <Card>
        <h2 className="font-semibold">Partidos jugados</h2>
        {played.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavia no jugaste ningun partido.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {played.map((r) => (
              <li key={r.match_id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{r.complex_name}</p>
                  <p className="text-xs text-neutral-500">
                    {r.court_name} · {formatDateTimeShort(r.starts_at)}
                  </p>
                </div>
                <Badge tone={r.match_status === "finished" ? "green" : "gray"}>
                  {r.match_status === "finished" ? "Finalizado" : "Jugado"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-center text-xs text-neutral-400">
        Los resultados y estadisticas avanzadas se incorporan mas adelante.
      </p>
    </div>
  );
}
