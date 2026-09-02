"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestOtp, type ActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Enviando codigo…" : "Enviar codigo"}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(requestOtp, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Numero de celular" error={state.error} hint="Ej: 11 2233 4455">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+54 9 11 2233 4455"
          required
          autoFocus
        />
      </Field>
      <SubmitButton />
      <p className="text-center text-xs text-neutral-400">
        Al continuar aceptas recibir un SMS con un codigo de verificacion.
      </p>
    </form>
  );
}
