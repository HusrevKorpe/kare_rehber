"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { kullaniciAktifDegistir, parolaSifirla } from "@/server/kullanici";

type Props = {
  id: string;
  aktif: boolean;
  kendisi: boolean;
};

export function AksiyonPaneli({ id, aktif, kendisi }: Props) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [mesaj, setMesaj] = useState<
    { tonu: "basari" | "hata"; metin: string } | null
  >(null);

  const aktifDegistir = () => {
    setMesaj(null);
    startTransition(async () => {
      const sonuc = await kullaniciAktifDegistir(id);
      if (!sonuc.ok) {
        setMesaj({ tonu: "hata", metin: sonuc.hata });
        return;
      }
      setMesaj({
        tonu: "basari",
        metin: sonuc.veri.aktif
          ? "Kullanıcı aktifleştirildi."
          : "Kullanıcı pasifleştirildi.",
      });
      router.refresh();
    });
  };

  const sifirla = () => {
    setMesaj(null);
    if (!confirm("Parola sıfırlanacak ve yeni parola SMS ile gönderilecek. Devam edilsin mi?")) return;
    startTransition(async () => {
      const sonuc = await parolaSifirla(id);
      if (!sonuc.ok) {
        setMesaj({ tonu: "hata", metin: sonuc.hata });
        return;
      }
      setMesaj({
        tonu: "basari",
        metin: "Yeni parola oluşturuldu ve SMS ile gönderildi.",
      });
    });
  };

  return (
    <div className="space-y-3">
      {mesaj ? <Alert tonu={mesaj.tonu}>{mesaj.metin}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={sifirla}
          disabled={bekliyor}
        >
          Parola sıfırla & SMS gönder
        </Button>
        <Button
          variant={aktif ? "danger" : "secondary"}
          onClick={aktifDegistir}
          disabled={bekliyor || kendisi}
        >
          {aktif ? "Pasifleştir" : "Aktifleştir"}
        </Button>
      </div>
      {kendisi ? (
        <p className="text-xs text-slate-500">
          Kendi hesabınızı pasifleştiremezsiniz.
        </p>
      ) : null}
    </div>
  );
}
