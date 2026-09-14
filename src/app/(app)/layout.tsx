import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPrompt } from "@/components/install-prompt";
import { signOut } from "@/features/auth/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.profile.role === "admin";

  return (
    <div>
      <header className="safe-top sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="header-inner flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">P</span>
            PadelMatch
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="app-shell">{children}</main>

      <BottomNav isAdmin={isAdmin} />
      <InstallPrompt />
    </div>
  );
}
