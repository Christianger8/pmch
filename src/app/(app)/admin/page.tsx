import { getDashboardStats } from "@/features/admin/queries";
import { Card, Stat } from "@/components/ui/card";

export const metadata = { title: "Panel de administracion" };

export default async function AdminDashboardPage() {
  const s = await getDashboardStats();

  const maxMonthly = Math.max(1, ...s.monthly.map((m) => m.matches));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Panel</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Jugadores registrados" value={s.players} />
        <Stat label="Complejos activos" value={`${s.complexes_active}/${s.complexes}`} />
        <Stat label="Canchas" value={s.courts} />
        <Stat label="Partidos creados" value={s.matches_total} />
        <Stat label="Disponibles" value={s.matches_open} />
        <Stat label="Completos" value={s.matches_full} />
        <Stat label="Finalizados" value={s.matches_finished} />
        <Stat label="Cancelados" value={s.matches_cancelled} />
      </div>

      <Card>
        <h2 className="font-semibold">Partidos por mes</h2>
        {s.monthly.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Sin datos aun.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {s.monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-neutral-500">{m.month}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(m.matches / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{m.matches}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Ocupacion por complejo</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {s.occupancy_by_complex.map((o) => (
            <li key={o.complex} className="flex items-center justify-between">
              <span>{o.complex}</span>
              <span className="text-neutral-500">
                {o.matches} partidos · {o.occupancy_pct}% ocupacion
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Ocupacion por cancha</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {s.occupancy_by_court.map((o) => (
            <li key={`${o.complex}-${o.court}`} className="flex items-center justify-between">
              <span>
                {o.complex} · {o.court}
              </span>
              <span className="text-neutral-500">
                {o.matches} partidos · {o.occupancy_pct}%
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
