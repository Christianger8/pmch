"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="text-lg font-bold">Algo salio mal</h1>
      <p className="text-sm text-neutral-500">Reintenta en unos segundos.</p>
      <Button size="sm" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
