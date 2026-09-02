import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl">🎾</p>
      <h1 className="text-lg font-bold">Pagina no encontrada</h1>
      <Link href="/" className="text-sm font-semibold text-brand-600 underline">
        Ir al inicio
      </Link>
    </div>
  );
}
