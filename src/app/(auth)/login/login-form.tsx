"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { requestOtp } from "@/features/auth/actions";
import type { ActionState } from "@/features/auth/types";
import type { OtpChannel } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";

function SubmitButton({ channel }: { channel: OtpChannel }) {
  const { pending } = useFormStatus();
  const label = channel === "whatsapp" ? "WhatsApp" : "SMS";
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Enviando codigo…" : `Enviar codigo por ${label}`}
    </Button>
  );
}

export function LoginForm({ next, defaultChannel }: { next: string; defaultChannel: OtpChannel }) {
  const [state, action] = useActionState<ActionState, FormData>(requestOtp, {});
  const [channel, setChannel] = useState<OtpChannel>(defaultChannel);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="channel" value={channel} />

      <Field
        label="Numero de celular"
        error={state.error}
        hint="Codigo de area + numero, sin el 0 ni el 15"
      >
        <div className="flex h-12 items-center rounded-xl border border-neutral-300 bg-white pl-3 pr-1 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:ring-brand-900">
          <span className="shrink-0 select-none text-[15px] font-medium text-neutral-500 dark:text-neutral-400">
            +54 9
          </span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 2233 4455"
            required
            autoFocus
            className="h-full w-full bg-transparent px-2 text-[15px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Recibir el codigo por
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(["whatsapp", "sms"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              aria-pressed={channel === c}
              className={cn(
                "h-11 rounded-xl border text-sm font-semibold transition-colors",
                channel === c
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                  : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
              )}
            >
              {c === "whatsapp" ? "WhatsApp" : "SMS"}
            </button>
          ))}
        </div>
      </div>

      <SubmitButton channel={channel} />

      <p className="text-center text-xs text-neutral-400">
        Al continuar aceptas recibir un mensaje con un codigo de verificacion.
      </p>
    </form>
  );
}
