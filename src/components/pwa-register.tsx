"use client";

import { useEffect } from "react";

/** Registra el service worker una vez montada la app. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      // La app vive bajo /partidup (ver next.config.mjs -> basePath).
      navigator.serviceWorker.register("/partidup/sw.js", { scope: "/partidup/" }).catch(() => {
        /* silencioso: la app funciona igual sin SW */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
