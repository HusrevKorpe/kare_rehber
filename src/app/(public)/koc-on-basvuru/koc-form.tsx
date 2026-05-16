"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  kocBasvuruSemasi,
  type KocBasvuruGirdi,
} from "@/lib/validation/basvuru";
import { kocBasvuruGonder } from "@/server/basvuru";

export function KocBasvuruForm() {
  const [bekliyor, startTransition] = useTransition();
  const [sunucuHata, setSunucuHata] = useState<string | null>(null);
  const [basariliMi, setBasariliMi] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KocBasvuruGirdi>({
    resolver: zodResolver(kocBasvuruSemasi),
    mode: "onBlur",
  });

  const onValid = (degerler: KocBasvuruGirdi) => {
    setSunucuHata(null);
    startTransition(async () => {
      const sonuc = await kocBasvuruGonder(degerler);
      if (!sonuc.ok) {
        setSunucuHata(sonuc.hata);
        return;
      }
      setBasariliMi(true);
      reset();
    });
  };

  if (basariliMi) {
    return (
      <Alert tonu="basari" baslik="Başvurunuz alındı">
        Koordinatörlerimiz başvurunuzu inceleyip kısa sürede telefonunuza SMS
        ile bilgi gönderecek.
        <div className="mt-3">
          <Button variant="outline" onClick={() => setBasariliMi(false)}>
            Yeni başvuru gönder
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5">
      {sunucuHata ? <Alert tonu="hata">{sunucuHata}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad" htmlFor="ad" hata={errors.ad?.message} zorunlu>
          <Input id="ad" invalid={!!errors.ad} {...register("ad")} />
        </Field>
        <Field
          label="Soyad"
          htmlFor="soyad"
          hata={errors.soyad?.message}
          zorunlu
        >
          <Input id="soyad" invalid={!!errors.soyad} {...register("soyad")} />
        </Field>
        <Field
          label="Telefon"
          htmlFor="telefon"
          hata={errors.telefon?.message}
          ipucu="Örn: 5xx xxx xx xx"
          zorunlu
        >
          <Input
            id="telefon"
            type="tel"
            invalid={!!errors.telefon}
            {...register("telefon")}
          />
        </Field>
        <Field
          label="Doğum tarihi"
          htmlFor="dogumTarihi"
          hata={errors.dogumTarihi?.message}
        >
          <Input
            id="dogumTarihi"
            type="date"
            invalid={!!errors.dogumTarihi}
            {...register("dogumTarihi")}
          />
        </Field>
        <Field
          label="E-posta"
          htmlFor="email"
          hata={errors.email?.message}
          className="sm:col-span-2"
        >
          <Input
            id="email"
            type="email"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field
          label="Uzmanlık alanı"
          htmlFor="uzmanlik"
          hata={errors.uzmanlik?.message}
          className="sm:col-span-2"
          ipucu="Örn: Matematik, Fen Bilimleri, Üniversite tercih danışmanlığı"
        >
          <Input
            id="uzmanlik"
            invalid={!!errors.uzmanlik}
            {...register("uzmanlik")}
          />
        </Field>
      </div>

      <Field
        label="Kendinizden bahsedin"
        htmlFor="notlar"
        hata={errors.notlar?.message}
      >
        <Textarea
          id="notlar"
          rows={5}
          placeholder="Tecrübeniz, motivasyonunuz, varsa müsait olduğunuz günler/saatler"
          invalid={!!errors.notlar}
          {...register("notlar")}
        />
      </Field>

      <Button type="submit" size="lg" disabled={bekliyor}>
        {bekliyor ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </Button>
    </form>
  );
}
