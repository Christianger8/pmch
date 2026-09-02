import { ComplexForm } from "@/features/admin/components/complex-form";

export const metadata = { title: "Nuevo complejo" };

export default function NewComplexPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nuevo complejo</h1>
      <ComplexForm />
    </div>
  );
}
