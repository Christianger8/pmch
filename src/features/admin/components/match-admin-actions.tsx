"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePlayer } from "@/features/admin/actions";
import { useToast } from "@/components/ui/toast";

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
