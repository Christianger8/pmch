"use client";

import { buildWhatsAppMessage, buildWhatsAppShareUrl } from "@/lib/whatsapp";
import { useToast } from "@/components/ui/toast";
import type { MatchDetails } from "@/lib/supabase/database.types";
import { env } from "@/lib/env";

export function ShareButtons({ match }: { match: MatchDetails }) {
  const { show } = useToast();
  const url = `${env.appUrl}/matches/${match.id}`;

  const nativeShare = async () => {
    const text = buildWhatsAppMessage(match);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Partido de padel", text, url });
      } catch {
        /* cancelado */
      }
    } else {
      await navigator.clipboard.writeText(`${text}`);
      show("Link copiado", "success");
    }
  };

  return (
    <div className="flex gap-2">
      <a
        href={buildWhatsAppShareUrl(match)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-[15px] font-semibold text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.25.7-1.45 1.3-2 1.35-.55.05-1.05.25-3.5-.75s-4-3.55-4.15-3.7c-.15-.2-1-1.3-1-2.5s.6-1.8.85-2.05a.9.9 0 0 1 .65-.3h.5c.15 0 .35-.05.55.45l.75 1.85c.05.15.1.3 0 .5l-.35.5-.3.3c-.15.15-.3.35-.15.6s.7 1.15 1.5 1.85c1 .9 1.9 1.15 2.15 1.3.25.15.4.1.55-.05l.8-.95c.2-.25.4-.2.65-.1l1.8.85c.25.15.4.2.45.3.05.15.05.7-.2 1.4Z" />
        </svg>
        Compartir por WhatsApp
      </a>
      <button
        onClick={nativeShare}
        aria-label="Compartir"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
        </svg>
      </button>
    </div>
  );
}
