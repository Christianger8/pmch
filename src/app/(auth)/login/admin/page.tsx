import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/session";
import { AdminLoginForm } from "./admin-login-form";

export const metadata = { title: "Ingreso administrador" };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect(user.profile.onboarded ? "/" : "/onboarding");

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ingreso de administrador</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acceso por email, mientras no hay WhatsApp/SMS configurado. Los jugadores
          siguen ingresando por celular.
        </p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
