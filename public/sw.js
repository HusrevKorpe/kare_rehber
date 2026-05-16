// KARE-Rehber service worker.
// Strateji: navigation istekleri için network-first + offline fallback.
// Statik varlıklar için stale-while-revalidate.
// API/server actions cache'lenmez.
// Push: notification gösterimi + tıklamada link açma.
// Offline kuyruğu: /api/gorusme/olustur POST'ları IDB'ye yazılır, sync ile gönderilir.

const SURUM = "kare-v2";
const STATIK_CACHE = `${SURUM}-statik`;
const SAYFA_CACHE = `${SURUM}-sayfa`;
const ONCEDEN_YUKLE = ["/offline.html", "/icon.svg", "/manifest.webmanifest"];

const KUYRUK_DB = "kare-kuyruk";
const KUYRUK_STORE = "gorusme";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIK_CACHE).then((c) => c.addAll(ONCEDEN_YUKLE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((isimler) =>
        Promise.all(
          isimler
            .filter((n) => !n.startsWith(SURUM))
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function apiYoluMu(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  );
}

function staticYolMu(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/favicon.ico" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(url.pathname)
  );
}

// ------------------ IndexedDB kuyruk yardımcıları ------------------

function dbAc() {
  return new Promise((cz, rd) => {
    const istek = indexedDB.open(KUYRUK_DB, 1);
    istek.onupgradeneeded = () => {
      const db = istek.result;
      if (!db.objectStoreNames.contains(KUYRUK_STORE)) {
        db.createObjectStore(KUYRUK_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    istek.onsuccess = () => cz(istek.result);
    istek.onerror = () => rd(istek.error);
  });
}

function kuyrugaEkle(kayit) {
  return dbAc().then(
    (db) =>
      new Promise((cz, rd) => {
        const tx = db.transaction(KUYRUK_STORE, "readwrite");
        tx.objectStore(KUYRUK_STORE).add(kayit);
        tx.oncomplete = () => cz();
        tx.onerror = () => rd(tx.error);
      }),
  );
}

function kuyrukOku() {
  return dbAc().then(
    (db) =>
      new Promise((cz, rd) => {
        const tx = db.transaction(KUYRUK_STORE, "readonly");
        const st = tx.objectStore(KUYRUK_STORE);
        const istek = st.getAll();
        istek.onsuccess = () => cz(istek.result || []);
        istek.onerror = () => rd(istek.error);
      }),
  );
}

function kuyruktanSil(id) {
  return dbAc().then(
    (db) =>
      new Promise((cz, rd) => {
        const tx = db.transaction(KUYRUK_STORE, "readwrite");
        tx.objectStore(KUYRUK_STORE).delete(id);
        tx.oncomplete = () => cz();
        tx.onerror = () => rd(tx.error);
      }),
  );
}

async function istemcileriBilgilendir(tip, veri) {
  const istemciler = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of istemciler) c.postMessage({ tip, veri });
}

async function kuyruguGonder() {
  const kayitlar = await kuyrukOku();
  let basarili = 0;
  let basarisiz = 0;
  for (const k of kayitlar) {
    try {
      const yanit = await fetch(k.url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-offline-replay": "1" },
        body: JSON.stringify(k.govde),
        credentials: "include",
      });
      if (yanit.ok) {
        await kuyruktanSil(k.id);
        basarili++;
      } else if (yanit.status === 401 || yanit.status === 403) {
        // Yetki yok: kuyrukta bırak.
        basarisiz++;
      } else if (yanit.status >= 400 && yanit.status < 500) {
        // Kalıcı hata: kuyruktan at.
        await kuyruktanSil(k.id);
        basarisiz++;
      } else {
        basarisiz++;
      }
    } catch {
      basarisiz++;
    }
  }
  await istemcileriBilgilendir("kuyruk-sync", { basarili, basarisiz });
  return { basarili, basarisiz };
}

// ------------------ fetch handler ------------------

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Offline görüşme oluşturma kuyruğu
  if (
    req.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/api/gorusme/olustur"
  ) {
    event.respondWith(
      (async () => {
        try {
          const klon = req.clone();
          const yanit = await fetch(req);
          if (yanit.ok || (yanit.status >= 400 && yanit.status < 500)) {
            return yanit;
          }
          throw new Error("ağ hatası");
        } catch {
          try {
            const govde = await req.clone().json();
            await kuyrugaEkle({
              url: "/api/gorusme/olustur",
              govde,
              tarih: Date.now(),
            });
            if ("sync" in self.registration) {
              try {
                await self.registration.sync.register("kuyruk-gorusme");
              } catch {}
            }
            return new Response(
              JSON.stringify({ ok: true, kuyruga: true }),
              {
                status: 202,
                headers: { "content-type": "application/json" },
              },
            );
          } catch {
            return new Response(
              JSON.stringify({ ok: false, hata: "Ağ yok, kuyruğa eklenemedi." }),
              {
                status: 503,
                headers: { "content-type": "application/json" },
              },
            );
          }
        }
      })(),
    );
    return;
  }

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (apiYoluMu(url)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const yanit = await fetch(req);
          const cache = await caches.open(SAYFA_CACHE);
          cache.put(req, yanit.clone());
          return yanit;
        } catch {
          const cache = await caches.open(SAYFA_CACHE);
          const onbellek = await cache.match(req);
          if (onbellek) return onbellek;
          const statik = await caches.open(STATIK_CACHE);
          return (await statik.match("/offline.html")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  if (staticYolMu(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIK_CACHE);
        const onbellek = await cache.match(req);
        const ag = fetch(req)
          .then((y) => {
            if (y.ok) cache.put(req, y.clone());
            return y;
          })
          .catch(() => onbellek);
        return onbellek ?? ag;
      })(),
    );
  }
});

// ------------------ Push ------------------

self.addEventListener("push", (event) => {
  let veri = { baslik: "KARE-Rehber", icerik: "Yeni bir bildirim var.", link: "/" };
  try {
    if (event.data) veri = { ...veri, ...event.data.json() };
  } catch {
    if (event.data) veri.icerik = event.data.text();
  }
  const secenekler = {
    body: veri.icerik,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { link: veri.link || "/" },
    tag: veri.tip || "kare-bildirim",
    renotify: false,
  };
  event.waitUntil(self.registration.showNotification(veri.baslik, secenekler));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    (async () => {
      const istemciler = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of istemciler) {
        if ("focus" in c) {
          await c.focus();
          if ("navigate" in c) {
            try {
              await c.navigate(link);
            } catch {}
          }
          return;
        }
      }
      await self.clients.openWindow(link);
    })(),
  );
});

// ------------------ Sync ------------------

self.addEventListener("sync", (event) => {
  if (event.tag === "kuyruk-gorusme") {
    event.waitUntil(kuyruguGonder());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.tip === "kuyruk-gonder") {
    event.waitUntil(kuyruguGonder());
  }
});
