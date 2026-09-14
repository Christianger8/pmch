import { listPlayers } from "@/features/admin/queries";
import { deletePlayer } from "@/features/admin/actions";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PlayerForm } from "@/features/admin/components/player-form";
import { displayPhone } from "@/lib/format";

export const metadata = { title: "Jugadores" };

export default async function AdminPlayersPage() {
  const players = await listPlayers();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Jugadores</h1>
      <p className="text-sm text-neutral-500">
        Cargalos de antemano con su celular: cuando entren por primera vez con
        WhatsApp o SMS, quedan enganchados con este mismo perfil (no tienen que
        completar el nombre de nuevo).
      </p>

      <Card>
        <h2 className="mb-3 font-semibold">Agregar jugador</h2>
        <PlayerForm />
      </Card>

      <Card>
        <h2 className="font-semibold">
          Cargados ({players.length})
        </h2>
        {players.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavia no cargaste ningun jugador.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{p.full_name ?? "Sin nombre"}</p>
                  <p className="text-xs text-neutral-400">{displayPhone(p.phone)}</p>
                </div>
                <ConfirmButton
                  action={deletePlayer.bind(null, p.id)}
                  confirmText={`Eliminar a "${p.full_name ?? p.phone}"?`}
                  successText="Jugador eliminado"
                >
                  Eliminar
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
