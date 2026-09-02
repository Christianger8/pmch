"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export function MatchFilters({
  cities,
  complexes,
}: {
  cities: string[];
  complexes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/?${next.toString()}`);
  };

  const onlyAvailable = params.get("available") === "1";

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <input
          type="date"
          value={params.get("date") ?? ""}
          onChange={(e) => update("date", e.target.value)}
          className="h-9 shrink-0 rounded-full border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          value={params.get("city") ?? ""}
          onChange={(e) => update("city", e.target.value)}
          className="h-9 shrink-0 rounded-full border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={params.get("complex") ?? ""}
          onChange={(e) => update("complex", e.target.value)}
          className="h-9 shrink-0 rounded-full border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Todos los complejos</option>
          {complexes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => update("available", onlyAvailable ? "" : "1")}
        className={cn(
          "h-9 rounded-full border px-4 text-sm font-medium",
          onlyAvailable
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-neutral-300 dark:border-neutral-700",
        )}
      >
        Solo con lugar
      </button>
    </div>
  );
}
