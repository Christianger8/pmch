import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listComplexes, listCourts } from "@/features/admin/queries";
import { MatchForm } from "@/features/matches/components/match-form";
import type { Match } from "@/lib/supabase/database.types";

export const metadata = { title: "Editar partido" };

export default async function EditMyMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: match }, complexes, courts] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).maybeSingle(),
    listComplexes(),
    listCourts(),
  ]);

  if (!match) notFound();

  const isOrganizer = match.created_by === user.id;
  const isAdmin = user.profile.role === "admin";
  if (!isOrganizer && !isAdmin) redirect(`/matches/${id}`);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar partido</h1>
      <MatchForm
        match={match as Match}
        complexes={complexes
          .filter((c) => c.status === "active" || c.id === match.complex_id)
          .map((c) => ({ id: c.id, name: c.name }))}
        courts={courts.map((c) => ({
          id: c.id,
          name: c.name,
          complex_id: c.complex_id,
          status: c.status,
        }))}
      />
    </div>
  );
}
