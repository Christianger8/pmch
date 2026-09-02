import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl">🎾</p>
      <h1 className="text-lg font-bold">No encontramos esta pagina</h1>
      <p className="text-sm text-neutral-500">Puede que el partido haya sido cancelado o eliminado.</p>
      <ButtonLink href="/" size="sm">
        Ver partidos
      </ButtonLink>
    </div>
  );
}
