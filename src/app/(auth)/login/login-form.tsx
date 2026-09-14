"use client";

import { useState, useTransition } from "react";
import { checkPhone, loginRegisteredPlayer, sendOtp } from "@/features/auth/actions";
import type { OtpChannel } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export function LoginForm({ next, defaultChannel }: { next: string; defaultChannel: OtpChannel }) {
  const [phoneInput, setPhoneInput] = useState("");
  const [step, setStep] = useState<"phone" | "channel">("phone");
  const [checkedPhone, setCheckedPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleContinue = () => {
    setError(null);
    startTransition(async () => {
      const result = await checkPhone(phoneInput);
      if (!result.ok || !result.phone) {
        setError(result.error ?? "Ingresa un numero de celular valido");
        return;
      }
      if (result.registered) {
        // Ya esta cargado por un admin: entra directo, sin WhatsApp/SMS.
        const loginResult = await loginRegisteredPlayer(result.phone, next);
        if (loginResult?.error) setError(loginResult.error);
        return;
      }
      setCheckedPhone(result.phone);
      setStep("channel");
    });
  };

  const handleSendNew = (channel: OtpChannel) => {
    if (!checkedPhone) return;
    setError(null);
    startTransition(async () => {
      const sendResult = await sendOtp(checkedPhone, channel, next);
      if (sendResult?.error) setError(sendResult.error);
    });
  };

  if (step === "channel" && checkedPhone) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
          Es la primera vez que <span className="font-medium">{checkedPhone}</span> entra. ¿Como
          preferis recibir tu codigo?
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending}
            onClick={() => handleSendNew("whatsapp")}
          >
            WhatsApp
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending}
            onClick={() => handleSendNew("sms")}
          >
            SMS
          </Button>
        </div>
        <button
          type="button"
          className="w-full text-center text-sm text-neutral-500 underline"
          onClick={() => {
            setStep("phone");
            setCheckedPhone(null);
            setError(null);
          }}
        >
          Cambiar numero
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Numero de celular" error={error ?? undefined} hint="Codigo de area + numero, sin el 0 ni el 15">
        <div
          className={cn(
            "flex h-12 items-center rounded-xl border border-neutral-300 bg-white pl-3 pr-1 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:ring-brand-900",
          )}
        >
          <span className="shrink-0 select-none text-[15px] font-medium text-neutral-500 dark:text-neutral-400">
            +54 9
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 2233 4455"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleContinue();
              }
            }}
            required
            autoFocus
            className="h-full w-full bg-transparent px-2 text-[15px] outline-none placeholder:text-neutral-400"
          />
        </div>
      </Field>

      <Button type="button" size="lg" disabled={pending} onClick={handleContinue}>
        {pending ? "Verificando…" : "Continuar"}
      </Button>

      <p className="text-center text-xs text-neutral-400">
        Al continuar aceptas recibir un mensaje con un codigo de verificacion.
      </p>
    </div>
  );
}
