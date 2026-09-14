/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // La app vive en cher.com.ar/partidup (no en la raiz del dominio).
  // Next agrega este prefijo solo a next/link, redirect(), etc. Los pocos
  // lugares con rutas escritas a mano (service worker, manifest) lo llevan
  // hardcodeado como BASE_PATH — ver public/sw.js y
  // src/app/manifest.webmanifest/route.ts si el path cambia de nuevo.
  basePath: "/partidup",
  // El lint se corre aparte (`npm run lint`); no bloquea el deploy.
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // cher.com.ar/  ->  cher.com.ar/partidup  (basePath:false = fuera del prefijo)
      { source: "/", destination: "/partidup", permanent: false, basePath: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/partidup/" },
        ],
      },
    ];
  },
};

export default nextConfig;
