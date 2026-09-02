"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Refresca la ruta actual cuando cambian inscripciones o partidos.
 * Se apoya en Supabase Realtime (Postgres changes).
 */
export function RealtimeRefresh({ matchId }: { matchId?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`rt-${matchId ?? "list"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations",
          ...(matchId ? { filter: `match_id=eq.${matchId}` } : {}),
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, router]);

  return null;
}
