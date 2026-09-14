"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createPlayer } from "@/features/admin/actions";
import type { FormResult } from "@/features/admin/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Guardando…" : "Agregar jugador"}
    </Button>
  );
}

export function PlayerForm() {
  const [state, action] = useActionState<FormResult, FormData>(createPlayer, {});
  const { show } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      show("Jugador agregado", "success");
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label="Nombre y apellido" error={fe.full_name}>
        <Input name="full_name" placeholder="Juan Perez" required />
      </Field>

      <Field label="Celular" error={fe.phone_local} hint="Codigo de area + numero, sin el 0 ni el 15">
        <div className="flex h-12 items-center rounded-xl border border-neutral-300 bg-white pl-3 pr-1 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:ring-brand-900">
          <span className="shrink-0 select-none text-[15px] font-medium text-neutral-500 dark:text-neutral-400">
            +54 9
          </span>
          <input
            name="phone_local"
            type="tel"
            inputMode="tel"
            placeholder="11 2233 4455"
            required
            className="h-full w-full bg-transparent px-2 text-[15px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
