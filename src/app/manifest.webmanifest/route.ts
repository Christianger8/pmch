import { NextResponse } from "next/server";

// Ruta normal (no la convencion especial app/manifest.ts) a proposito: con
// basePath configurado, Next arma el <link rel="manifest"> del archivo de
// convencion IGNORANDO el prefijo que le pongamos a mano en layout.tsx.
// Sirviendolo como una ruta comun, el link manual si respeta /padelmatch.
const BASE_PATH = "/padelmatch";

export function GET() {
  const manifest = {
    name: "Partidup",
    short_name: "Partidup",
    description: "Organiza tus partidos de padel y completa los cuatro jugadores en segundos.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#16a34a",
    lang: "es-AR",
    categories: ["sports", "lifestyle"],
    icons: [
      { src: `${BASE_PATH}/icons/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: `${BASE_PATH}/icons/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Proximos partidos", url: `${BASE_PATH}/me/upcoming` },
      { name: "Mi historial", url: `${BASE_PATH}/me/history` },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
