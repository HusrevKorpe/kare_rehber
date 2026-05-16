"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";

type Ogrenci = { userId: string; ad: string; soyad: string };

export function YeniGorusmeFormu({ ogrenciler }: { ogrenciler: Ogrenci[] }) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [alanHatalari, setAlanHatalari] = useState<Record<string, string>>({});
  const [cevrimDisi, setCevrimDisi] = useState(false);
  const [ogrenciUserId, setOgrenciUserId] = useState(
    ogrenciler[0]?.userId ?? "",
  );
  const [tarih, setTarih] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [konu, setKonu] = useState("");
  const [not, setNot] = useState("");
  const [ilerleme, setIlerleme] = useState("");

  useEffect(() => {
    const guncelle = () => setCevrimDisi(!navigator.onLine);
    guncelle();
    window.addEventListener("online", guncelle);
    window.addEventListener("offline", guncelle);
    return () => {
      window.removeEventListener("online", guncelle);
      window.removeEventListener("offline", guncelle);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const dinleyici = (e: MessageEvent) => {
      const veri = e.data;
      if (veri && veri.tip === "kuyruk-sync") {
        const b = veri.veri?.basarili ?? 0;
        if (b > 0) {
          setBilgi(`${b} bekleyen görüşme arka planda gönderildi.`);
          router.refresh();
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", dinleyici);
    return () => {
      navigator.serviceWorker.removeEventListener("message", dinleyici);
    };
  }, [router]);

  const gonder = () => {
    setHata(null);
    setBilgi(null);
    setAlanHatalari({});
    startTransition(async () => {
      const govde = {
        ogrenciUserId,
        tarih,
        konu: konu || undefined,
        not,
        ilerlemePuani: ilerleme || undefined,
      };
      try {
        const yanit = await fetch("/api/gorusme/olustur", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(govde),
        });
        const veri = (await yanit.json().catch(() => null)) as
          | {
              ok?: boolean;
              kuyruga?: boolean;
              hata?: string;
              alanHatalari?: Record<string, string>;
            }
          | null;

        if (yanit.status === 202 && veri?.kuyruga) {
          setBilgi(
            "Bağlantı yok; görüşme cihazınıza kaydedildi. İnternet gelince otomatik gönderilecek.",
          );
          setKonu("");
          setNot("");
          setIlerleme("");
          return;
        }
        if (!yanit.ok || !veri?.ok) {
          setHata(veri?.hata ?? "Görüşme kaydedilemedi.");
          setAlanHatalari(veri?.alanHatalari ?? {});
          return;
        }
        router.push("/koc/gorusmeler");
        router.refresh();
      } catch {
        setHata("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        gonder();
      }}
      className="space-y-4"
    >
      {cevrimDisi ? (
        <Alert tonu="uyari">
          Çevrim dışısınız. Form bilgileri cihazınıza kaydedilip internet
          bağlantısı kurulunca arka planda gönderilecek.
        </Alert>
      ) : null}
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}
      {bilgi ? <Alert tonu="basari">{bilgi}</Alert> : null}

      <Field label="Öğrenci" zorunlu hata={alanHatalari.ogrenciUserId}>
        <Select
          value={ogrenciUserId}
          onChange={(e) => setOgrenciUserId(e.target.value)}
          invalid={!!alanHatalari.ogrenciUserId}
        >
          {ogrenciler.map((o) => (
            <option key={o.userId} value={o.userId}>
              {o.ad} {o.soyad}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tarih ve saat" zorunlu hata={alanHatalari.tarih}>
        <Input
          type="datetime-local"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          invalid={!!alanHatalari.tarih}
        />
      </Field>

      <Field label="Konu" hata={alanHatalari.konu}>
        <Input
          value={konu}
          onChange={(e) => setKonu(e.target.value)}
          placeholder="Örn. Aile durumu, sınav stresi"
          invalid={!!alanHatalari.konu}
        />
      </Field>

      <Field
        label="Görüşme notu"
        zorunlu
        hata={alanHatalari.not}
        ipucu="En az 10 karakter. Veli/öğrenci/koordinatör ile paylaşılabilir."
      >
        <Textarea
          rows={6}
          value={not}
          onChange={(e) => setNot(e.target.value)}
          invalid={!!alanHatalari.not}
        />
      </Field>

      <Field
        label="İlerleme puanı (0–10)"
        hata={alanHatalari.ilerlemePuani}
        ipucu="Opsiyonel. Öğrencinin gelişimini kendi değerlendirmenizle skorlayın."
      >
        <Input
          type="number"
          min={0}
          max={10}
          step={1}
          value={ilerleme}
          onChange={(e) => setIlerleme(e.target.value)}
          invalid={!!alanHatalari.ilerlemePuani}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor…" : "Gönder ve onaya yolla"}
        </Button>
      </div>
    </form>
  );
}
