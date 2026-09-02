import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect(user.profile.onboarded ? "/" : "/onboarding");

  const { next } = await searchParams;

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M3.5 9c4 0 7.5 3.5 7.5 9M20.5 9c-4 0-7.5 3.5-7.5 9" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">PadelMatch</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ingresa con tu celular. Te enviamos un codigo por SMS.
        </p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
