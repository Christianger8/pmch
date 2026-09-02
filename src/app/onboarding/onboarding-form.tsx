"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeOnboarding } from "@/features/auth/actions";
import type { ActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Continuar"}
    </Button>
  );
}

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<ActionState, FormData>(completeOnboarding, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Nombre y apellido" error={state.error}>
        <Input name="full_name" defaultValue={defaultName} placeholder="Juan Perez" required autoFocus />
      </Field>
      <SubmitButton />
    </form>
  );
}
