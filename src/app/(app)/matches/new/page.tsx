import { requireUser } from "@/features/auth/session";
import { listComplexes, listCourts } from "@/features/admin/queries";
import { MatchForm } from "@/features/matches/components/match-form";

export const metadata = { title: "Organizar partido" };

export default async function NewMatchPage() {
  const user = await requireUser();
  const [complexes, courts] = await Promise.all([listComplexes(), listCourts()]);
  const activeComplexes = complexes.filter((c) => c.status === "active");
  const activeCourts = courts.filter((c) => c.status === "active");

  if (activeComplexes.length === 0 || activeCourts.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Organizar partido</h1>
        <p className="text-sm text-neutral-500">
          Todavia no hay complejos o canchas cargados.{" "}
          {user.profile.role === "admin"
            ? "Cargalos primero desde el panel de administracion."
            : "Pedile a un administrador que cargue al menos uno para poder organizar un partido."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Organizar partido</h1>
      <p className="text-sm text-neutral-500">
        Elegi complejo, cancha, horario y cupo. Vas a quedar como organizador.
      </p>
      <MatchForm
        complexes={activeComplexes.map((c) => ({ id: c.id, name: c.name }))}
        courts={activeCourts.map((c) => ({
          id: c.id,
          name: c.name,
          complex_id: c.complex_id,
          status: c.status,
        }))}
      />
    </div>
  );
}
