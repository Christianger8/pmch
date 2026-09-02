"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Boton que pide confirmacion y ejecuta una server action que devuelve
 * { ok?: boolean; error?: string }.
 */
export function ConfirmButton({
  action,
  confirmText,
  successText,
  children,
  variant = "danger",
  size = "sm",
}: {
  action: () => Promise<{ ok?: boolean; error?: string }>;
  confirmText: string;
  successText?: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          const res = await action();
          if (res.error) return show(res.error, "error");
          if (successText) show(successText, "success");
          router.refresh();
        });
      }}
    >
      {pending ? "…" : children}
    </Button>
  );
}
