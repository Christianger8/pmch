import { redirect } from "next/navigation";
import { AdminVerifyForm } from "./admin-verify-form";

export const metadata = { title: "Verificar codigo" };

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/login/admin");

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ingresa el codigo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enviamos un email a <span className="font-medium text-neutral-700 dark:text-neutral-200">{email}</span>
        </p>
      </div>
      <AdminVerifyForm email={email} />
    </div>
  );
}
