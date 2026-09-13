"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestAdminOtp } from "@/features/auth/actions";
import type { ActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Enviando codigo…" : "Enviar codigo por email"}
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(requestAdminOtp, {});

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" error={state.error}>
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
          autoFocus
        />
      </Field>
      <SubmitButton />
      <p className="text-center text-sm">
        <Link href="/login" className="text-neutral-500 underline">
          Volver al ingreso por celular
        </Link>
      </p>
    </form>
  );
}
