"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { resendAdminOtp, verifyAdminOtp } from "@/features/auth/actions";
import type { ActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Verificando…" : "Ingresar"}
    </Button>
  );
}

export function AdminVerifyForm({ email }: { email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(verifyAdminOtp, {});
  const [resent, setResent] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <Field label="Codigo de verificacion" error={state.error}>
        <Input
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={8}
          placeholder="123456"
          className="text-center text-2xl tracking-[0.5em]"
          required
          autoFocus
        />
      </Field>
      <SubmitButton />

      <div className="flex items-center justify-between text-sm">
        <Link href="/login/admin" className="text-neutral-500 underline">
          Cambiar email
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await resendAdminOtp(email);
              setResent(r.error ?? "Codigo reenviado");
            })
          }
          className="text-brand-600 disabled:opacity-50"
        >
          Reenviar codigo
        </button>
      </div>
      {resent && <p className="text-center text-xs text-neutral-500">{resent}</p>}
    </form>
  );
}
