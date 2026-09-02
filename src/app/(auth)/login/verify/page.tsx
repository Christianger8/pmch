import { redirect } from "next/navigation";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verificar codigo" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; next?: string }>;
}) {
  const { phone, next } = await searchParams;
  if (!phone) redirect("/login");

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ingresa el codigo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enviamos un SMS a <span className="font-medium text-neutral-700 dark:text-neutral-200">{phone}</span>
        </p>
      </div>
      <VerifyForm phone={phone} next={next ?? "/"} />
    </div>
  );
}
