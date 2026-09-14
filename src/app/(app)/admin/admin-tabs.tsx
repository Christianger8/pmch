"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/matches", label: "Partidos" },
  { href: "/admin/players", label: "Jugadores" },
  { href: "/admin/complexes", label: "Complejos" },
  { href: "/admin/courts", label: "Canchas" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
      {tabs.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                : "text-neutral-500",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
