"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMatch, finishMatch, removePlayer } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function MatchAdminActions({
  matchId,
  status,
}: {
  matchId: string;
  status: "open" | "full" | "cancelled" | "finished";
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok?: boolean; error?: string }>, ok: string, confirm: string) => {
    if (!window.confirm(confirm)) return;
    startTransition(async () => {
      const res = await fn();
      if (res.error) return show(res.error, "error");
      show(ok, "success");
      router.refresh();
    });
  };

  if (status === "cancelled" || status === "finished") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(() => finishMatch(matchId), "Partido finalizado", "Marcar este partido como finalizado?")
        }
      >
        Finalizar
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            () => cancelMatch(matchId),
            "Partido cancelado",
            "Cancelar el partido? Se avisa a los jugadores.",
          )
        }
      >
        Cancelar partido
      </Button>
    </div>
  );
}

export function RemovePlayerButton({
  matchId,
  userId,
  playerName,
}: {
  matchId: string;
  userId: string;
  playerName: string;
}) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  return (
    <button
      className="text-xs font-medium text-red-600 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Quitar a ${playerName} del partido?`)) return;
        startTransition(async () => {
          const res = await removePlayer(matchId, userId);
          if (res.error) return show(res.error, "error");
          show("Jugador removido", "info");
          router.refresh();
        });
      }}
    >
      Quitar
    </button>
  );
}
