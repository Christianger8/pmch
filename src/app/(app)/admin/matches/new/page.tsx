import { listComplexes, listCourts } from "@/features/admin/queries";
import { MatchForm } from "@/features/admin/components/match-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Nuevo partido" };

export default async function NewMatchPage() {
  const [complexes, courts] = await Promise.all([listComplexes(), listCourts()]);
  const activeComplexes = complexes.filter((c) => c.status === "active");

  if (activeComplexes.length === 0 || courts.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Nuevo partido</h1>
        <p className="text-sm text-neutral-500">
          Necesitas al menos un complejo activo y una cancha para crear partidos.
        </p>
        <div className="flex gap-2">
          <ButtonLink href="/admin/complexes/new" size="sm" variant="secondary">
            Crear complejo
          </ButtonLink>
          <ButtonLink href="/admin/courts/new" size="sm" variant="secondary">
            Crear cancha
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nuevo partido</h1>
      <MatchForm
        complexes={activeComplexes.map((c) => ({ id: c.id, name: c.name }))}
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
