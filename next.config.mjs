/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // La app vive en cher.com.ar/padelmatch (no en la raiz del dominio).
  // Next agrega este prefijo solo a next/link, redirect(), etc. Los pocos
  // lugares con rutas escritas a mano (service worker, manifest) lo llevan
  // hardcodeado — ver PADELMATCH_BASE_PATH mas abajo si el path cambia.
  basePath: "/padelmatch",
  // El lint se corre aparte (`npm run lint`); no bloquea el deploy.
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // cher.com.ar/  ->  cher.com.ar/padelmatch  (basePath:false = fuera del prefijo)
      { source: "/", destination: "/padelmatch", permanent: false, basePath: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/padelmatch/" },
        ],
      },
    ];
  },
};

export default nextConfig;
