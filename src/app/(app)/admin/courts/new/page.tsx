import { listComplexes } from "@/features/admin/queries";
import { CourtForm } from "@/features/admin/components/court-form";

export const metadata = { title: "Nueva cancha" };

export default async function NewCourtPage({
  searchParams,
}: {
  searchParams: Promise<{ complex?: string }>;
}) {
  const { complex } = await searchParams;
  const complexes = await listComplexes();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nueva cancha</h1>
      <CourtForm
        complexes={complexes.map((c) => ({ id: c.id, name: c.name }))}
        defaultComplexId={complex}
      />
    </div>
  );
}
