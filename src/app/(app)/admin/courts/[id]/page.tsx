import { notFound } from "next/navigation";
import { getCourt, listComplexes } from "@/features/admin/queries";
import { CourtForm } from "@/features/admin/components/court-form";

export const metadata = { title: "Editar cancha" };

export default async function EditCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [court, complexes] = await Promise.all([getCourt(id), listComplexes()]);
  if (!court) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar cancha</h1>
      <CourtForm court={court} complexes={complexes.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
