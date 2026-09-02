import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Completa tu perfil" };

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.profile.onboarded) redirect("/");

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Como te llamas?</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tu nombre aparece en la lista de jugadores de cada partido.
      </p>
      <div className="mt-6">
        <OnboardingForm defaultName={user.profile.full_name ?? ""} />
      </div>
    </div>
  );
}
