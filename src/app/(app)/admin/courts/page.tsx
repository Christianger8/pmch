import Link from "next/link";
import { listComplexes, listCourts } from "@/features/admin/queries";
import { setCourtStatus } from "@/features/admin/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";

export const metadata = { title: "Canchas" };

export default async function AdminCourtsPage() {
  const [courts, complexes] = await Promise.all([listCourts(), listComplexes()]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Canchas</h1>
        {complexes.length > 0 && (
          <ButtonLink href="/admin/courts/new" size="sm">
            Nueva
          </ButtonLink>
        )}
      </div>

      {complexes.length === 0 && (
        <p className="text-sm text-neutral-500">
          Primero crea un complejo en la pestaña Complejos.
        </p>
      )}

      {courts.map((c) => (
        <Card key={c.id} className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{c.name}</p>
              <Badge tone={c.status === "active" ? "green" : "gray"}>
                {c.status === "active" ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">
              {c.complex_name} · {c.surface_type === "indoor" ? "Indoor" : "Outdoor"}
            </p>
            {c.notes && <p className="mt-1 text-xs text-neutral-400">{c.notes}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Link href={`/admin/courts/${c.id}`} className="text-sm font-medium text-brand-600">
              Editar
            </Link>
            <ConfirmButton
              variant="outline"
              action={setCourtStatus.bind(null, c.id, c.status === "active" ? "inactive" : "active")}
              confirmText={
                c.status === "active" ? `Desactivar "${c.name}"?` : `Activar "${c.name}"?`
              }
              successText="Cancha actualizada"
            >
              {c.status === "active" ? "Desactivar" : "Activar"}
            </ConfirmButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
