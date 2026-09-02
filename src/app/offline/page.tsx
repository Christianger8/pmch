export const metadata = { title: "Sin conexion" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl">📡</p>
      <h1 className="text-lg font-bold">Estas sin conexion</h1>
      <p className="text-sm text-neutral-500">
        Volve a intentar cuando tengas internet. La app se actualiza sola al reconectar.
      </p>
    </div>
  );
}
