import Link from "next/link";
import { listAdminMatches } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { MatchStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTimeShort } from "@/lib/format";

export const metadata = { title: "Partidos (admin)" };

const scopes = [
  { key: "upcoming", label: "Proximos" },
  { key: "past", label: "Pasados" },
  { key: "all", label: "Todos" },
];

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const scope = (sp.scope as "upcoming" | "past" | "all") ?? "upcoming";
  const matches = await listAdminMatches({ scope, status: sp.status });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Partidos</h1>
        <ButtonLink href="/admin/matches/new" size="sm">
          Nuevo
        </ButtonLink>
      </div>

      <div className="flex gap-2">
        {scopes.map((s) => (
          <Link
            key={s.key}
            href={`/admin/matches?scope=${s.key}`}
            className={
              scope === s.key
                ? "rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white"
                : "rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
            }
          >
            {s.label}
          </Link>
        ))}
      </div>

      {matches.length === 0 && <p className="text-sm text-neutral-500">Sin partidos.</p>}

      {matches.map((m) => (
        <Link key={m.id} href={`/admin/matches/${m.id}`} className="block">
          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {m.complex_name} · {m.court_name}
              </p>
              <p className="text-sm text-neutral-500">
                {formatDateTimeShort(m.starts_at)} · {m.confirmed_count}/{m.max_players} jugadores
                {m.waitlist_count > 0 && ` · ${m.waitlist_count} en espera`}
              </p>
            </div>
            <MatchStatusBadge status={m.status} />
          </Card>
        </Link>
      ))}
    </div>
  );
}
