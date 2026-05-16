"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ayarlariKaydet } from "@/server/ayar";

type Props = {
  varsayilan: { gorusmePeriyotGun: string; appAdi: string };
};

export function AyarFormu({ varsayilan }: Props) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [alanHatalari, setAlanHatalari] = useState<Record<string, string>>({});
  const [periyot, setPeriyot] = useState(varsayilan.gorusmePeriyotGun);
  const [adi, setAdi] = useState(varsayilan.appAdi);

  const gonder = () => {
    setHata(null);
    setBasari(null);
    setAlanHatalari({});
    startTransition(async () => {
      const s = await ayarlariKaydet({
        gorusmePeriyotGun: periyot,
        appAdi: adi,
      });
      if (!s.ok) {
        setHata(s.hata);
        setAlanHatalari(s.alanHatalari ?? {});
        return;
      }
      setBasari("Ayarlar kaydedildi.");
      router.refresh();
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
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}
      {basari ? <Alert tonu="basari">{basari}</Alert> : null}

      <Field
        label="Görüşme periyodu (gün)"
        zorunlu
        hata={alanHatalari.gorusmePeriyotGun}
        ipucu="Bir koçun aynı öğrenciyle yapacağı görüşmelerin önerilen aralığı. Geciken görüşmeler için uyarı eşiği olarak kullanılır."
      >
        <Input
          type="number"
          min={1}
          max={365}
          step={1}
          value={periyot}
          onChange={(e) => setPeriyot(e.target.value)}
          invalid={!!alanHatalari.gorusmePeriyotGun}
        />
      </Field>

      <Field
        label="Uygulama adı"
        zorunlu
        hata={alanHatalari.appAdi}
        ipucu="SMS ve panel başlığında kullanılır."
      >
        <Input
          value={adi}
          onChange={(e) => setAdi(e.target.value)}
          invalid={!!alanHatalari.appAdi}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
