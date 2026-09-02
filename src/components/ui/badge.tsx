import { cn } from "@/lib/cn";
import type { MatchStatus } from "@/lib/supabase/database.types";

const tones = {
  green: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  gray: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
} as const;

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { tone: keyof typeof tones; label: string }> = {
    open: { tone: "green", label: "Disponible" },
    full: { tone: "amber", label: "Completo" },
    cancelled: { tone: "red", label: "Cancelado" },
    finished: { tone: "gray", label: "Finalizado" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
