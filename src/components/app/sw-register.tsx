"use client";

import { useEffect } from "react";

export function ServiceWorkerKaydi() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const kayitEt = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // SW kaydı başarısız olsa da uygulama çalışmaya devam etmeli.
        });
    };

    if (document.readyState === "complete") {
      kayitEt();
    } else {
      window.addEventListener("load", kayitEt, { once: true });
    }
  }, []);

  return null;
}
