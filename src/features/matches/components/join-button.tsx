"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinMatch, leaveMatch } from "@/features/matches/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { MatchActionState } from "@/core/domain/match";

export function JoinButton({
  matchId,
  actionState,
  size = "md",
}: {
  matchId: string;
  actionState: MatchActionState;
  size?: "sm" | "md" | "lg";
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const { canJoin, canJoinWaitlist, canLeave, label } = actionState;

  if (!canJoin && !canJoinWaitlist && !canLeave) {
    return (
      <Button size={size} variant="secondary" disabled>
        {label}
      </Button>
    );
  }

  const handleJoin = () =>
    startTransition(async () => {
      const res = await joinMatch(matchId);
      if (!res.ok) return show(res.error ?? "No se pudo completar", "error");
      show(
        res.status === "confirmed" ? "Quedaste anotado" : "Estas en la lista de espera",
        "success",
      );
      router.refresh();
    });

  const handleLeave = () =>
    startTransition(async () => {
      const res = await leaveMatch(matchId);
      if (!res.ok) return show(res.error ?? "No se pudo completar", "error");
      show("Cancelaste tu inscripcion", "info");
      router.refresh();
    });

  if (canLeave) {
    return (
      <Button size={size} variant="outline" onClick={handleLeave} disabled={pending}>
        {pending ? "…" : "Cancelar inscripcion"}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={canJoinWaitlist ? "secondary" : "primary"}
      onClick={handleJoin}
      disabled={pending}
    >
      {pending ? "…" : label}
    </Button>
  );
}
