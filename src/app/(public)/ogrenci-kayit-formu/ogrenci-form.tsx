"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  ogrenciBasvuruSemasi,
  type OgrenciBasvuruGirdi,
} from "@/lib/validation/basvuru";
import { ogrenciBasvuruGonder } from "@/server/basvuru";

export function OgrenciBasvuruForm() {
  const [bekliyor, startTransition] = useTransition();
  const [sunucuHata, setSunucuHata] = useState<string | null>(null);
  const [basariliMi, setBasariliMi] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OgrenciBasvuruGirdi>({
    resolver: zodResolver(ogrenciBasvuruSemasi),
    mode: "onBlur",
  });

  const onValid = (degerler: OgrenciBasvuruGirdi) => {
    setSunucuHata(null);
    startTransition(async () => {
      const sonuc = await ogrenciBasvuruGonder(degerler);
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
        Yöneticilerimiz başvurunuzu inceleyip kısa sürede telefonunuza SMS ile
        bilgi gönderecek.
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={() => setBasariliMi(false)}
          >
            Yeni başvuru gönder
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5">
      {sunucuHata ? <Alert tonu="hata">{sunucuHata}</Alert> : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-700">
          Öğrenci bilgileri
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad" htmlFor="ad" hata={errors.ad?.message} zorunlu>
            <Input id="ad" invalid={!!errors.ad} {...register("ad")} />
          </Field>
          <Field label="Soyad" htmlFor="soyad" hata={errors.soyad?.message} zorunlu>
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
          <Field label="İl" htmlFor="il" hata={errors.il?.message} zorunlu>
            <Input id="il" invalid={!!errors.il} {...register("il")} />
          </Field>
          <Field label="İlçe" htmlFor="ilce" hata={errors.ilce?.message}>
            <Input id="ilce" invalid={!!errors.ilce} {...register("ilce")} />
          </Field>
          <Field label="Sınıf" htmlFor="sinif" hata={errors.sinif?.message}>
            <Input id="sinif" invalid={!!errors.sinif} {...register("sinif")} />
          </Field>
          <Field label="Okul" htmlFor="okul" hata={errors.okul?.message}>
            <Input id="okul" invalid={!!errors.okul} {...register("okul")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-700">
          Veli bilgileri (opsiyonel)
        </legend>
        <p className="text-xs text-slate-500">
          18 yaşından küçükseniz lütfen veli bilgilerini doldurun.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Veli adı"
            htmlFor="veliAd"
            hata={errors.veliAd?.message}
          >
            <Input id="veliAd" invalid={!!errors.veliAd} {...register("veliAd")} />
          </Field>
          <Field
            label="Veli soyadı"
            htmlFor="veliSoyad"
            hata={errors.veliSoyad?.message}
          >
            <Input
              id="veliSoyad"
              invalid={!!errors.veliSoyad}
              {...register("veliSoyad")}
            />
          </Field>
          <Field
            label="Veli telefon"
            htmlFor="veliTelefon"
            hata={errors.veliTelefon?.message}
            className="sm:col-span-2"
          >
            <Input
              id="veliTelefon"
              type="tel"
              invalid={!!errors.veliTelefon}
              {...register("veliTelefon")}
            />
          </Field>
        </div>
      </fieldset>

      <Field label="Notlar" htmlFor="notlar" hata={errors.notlar?.message}>
        <Textarea
          id="notlar"
          rows={4}
          placeholder="Eklemek istediğiniz bilgi var mı?"
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
