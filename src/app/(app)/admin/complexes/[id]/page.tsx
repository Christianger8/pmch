import { notFound } from "next/navigation";
import { getComplex } from "@/features/admin/queries";
import { ComplexForm } from "@/features/admin/components/complex-form";

export const metadata = { title: "Editar complejo" };

export default async function EditComplexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complex = await getComplex(id);
  if (!complex) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar complejo</h1>
      <ComplexForm complex={complex} />
    </div>
  );
}
