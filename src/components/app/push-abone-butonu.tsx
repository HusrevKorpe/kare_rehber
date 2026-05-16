"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function base64UrlToBuffer(base64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type Durum = "yukleniyor" | "desteksiz" | "kapali" | "acik" | "izin-yok";

export function PushAboneButonu() {
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;

    async function kontrol() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !VAPID_PUBLIC
      ) {
        if (!iptal) setDurum("desteksiz");
        return;
      }
      if (Notification.permission === "denied") {
        if (!iptal) setDurum("izin-yok");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!iptal) setDurum(sub ? "acik" : "kapali");
      } catch {
        if (!iptal) setDurum("desteksiz");
      }
    }

    kontrol();
    return () => {
      iptal = true;
    };
  }, []);

  async function acik() {
    setMesaj(null);
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") {
        setDurum("izin-yok");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBuffer(VAPID_PUBLIC),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const yanit = await fetch("/api/push/abone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!yanit.ok) throw new Error("kayıt başarısız");
      setDurum("acik");
      setMesaj("Bildirimler açıldı.");
    } catch (err) {
      console.error(err);
      setMesaj("Bildirim açılamadı.");
    }
  }

  async function kapat() {
    setMesaj(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(
          `/api/push/abone?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE" },
        );
        await sub.unsubscribe();
      }
      setDurum("kapali");
      setMesaj("Bildirimler kapatıldı.");
    } catch {
      setMesaj("Kapatma sırasında hata oluştu.");
    }
  }

  if (durum === "yukleniyor") {
    return <span className="text-sm text-slate-500">…</span>;
  }
  if (durum === "desteksiz") {
    return (
      <span className="text-sm text-slate-500">Bildirim desteklenmiyor</span>
    );
  }
  if (durum === "izin-yok") {
    return (
      <span className="text-sm text-rose-600">
        Bildirim izni reddedildi. Tarayıcı ayarlarından açın.
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {durum === "acik" ? (
        <button
          type="button"
          onClick={kapat}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Push bildirimleri kapat
        </button>
      ) : (
        <button
          type="button"
          onClick={acik}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Push bildirimlerini aç
        </button>
      )}
      {mesaj ? <p className="text-xs text-slate-600">{mesaj}</p> : null}
    </div>
  );
}
