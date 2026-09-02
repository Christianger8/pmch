import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listComplexes, listCourts } from "@/features/admin/queries";
import { MatchForm } from "@/features/admin/components/match-form";
import type { Match } from "@/lib/supabase/database.types";

export const metadata = { title: "Editar partido" };

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: match }, complexes, courts] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).maybeSingle(),
    listComplexes(),
    listCourts(),
  ]);

  if (!match) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar partido</h1>
      <MatchForm
        match={match as Match}
        complexes={complexes.map((c) => ({ id: c.id, name: c.name }))}
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
