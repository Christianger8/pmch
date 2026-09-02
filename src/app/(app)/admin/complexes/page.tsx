import Link from "next/link";
import { listComplexes } from "@/features/admin/queries";
import { deleteComplex } from "@/features/admin/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";

export const metadata = { title: "Complejos" };

export default async function AdminComplexesPage() {
  const complexes = await listComplexes();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Complejos</h1>
        <ButtonLink href="/admin/complexes/new" size="sm">
          Nuevo
        </ButtonLink>
      </div>

      {complexes.length === 0 && (
        <p className="text-sm text-neutral-500">Todavia no hay complejos.</p>
      )}

      {complexes.map((c) => (
        <Card key={c.id} className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{c.name}</p>
              <Badge tone={c.status === "active" ? "green" : "gray"}>
                {c.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">
              {[c.address, c.city, c.province].filter(Boolean).join(", ") || "Sin direccion"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Link href={`/admin/complexes/${c.id}`} className="text-sm font-medium text-brand-600">
              Editar
            </Link>
            <ConfirmButton
              action={deleteComplex.bind(null, c.id)}
              confirmText={`Eliminar "${c.name}"? Se borran sus canchas.`}
              successText="Complejo eliminado"
            >
              Eliminar
            </ConfirmButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
