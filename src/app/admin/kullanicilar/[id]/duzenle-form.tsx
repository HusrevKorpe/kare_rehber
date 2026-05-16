"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import type { Rol } from "@/generated/prisma/enums";
import {
  KOC_DURUMU_VALUES,
  kullaniciDuzenleSemasi,
  type KullaniciDuzenleGirdi,
} from "@/lib/validation/kullanici";
import { kullaniciGuncelle } from "@/server/kullanici";

type Props = {
  id: string;
  rol: Rol;
  baslangic: KullaniciDuzenleGirdi;
};

export function KullaniciDuzenleForm({ id, rol, baslangic }: Props) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KullaniciDuzenleGirdi>({
    resolver: zodResolver(kullaniciDuzenleSemasi),
    defaultValues: baslangic,
    mode: "onBlur",
  });

  const onValid = (degerler: KullaniciDuzenleGirdi) => {
    setHata(null);
    setBasari(null);
    startTransition(async () => {
      const sonuc = await kullaniciGuncelle(id, degerler);
      if (!sonuc.ok) {
        setHata(sonuc.hata);
        return;
      }
      setBasari("Kullanıcı bilgileri güncellendi.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}
      {basari ? <Alert tonu="basari">{basari}</Alert> : null}

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
      </div>

      {rol === "KOORDINATOR" ? (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
          <Field
            label="Vakıf adı"
            htmlFor="vakifAdi"
            hata={errors.vakifAdi?.message}
            zorunlu
          >
            <Input
              id="vakifAdi"
              invalid={!!errors.vakifAdi}
              {...register("vakifAdi")}
            />
          </Field>
          <Field label="İl" htmlFor="il" hata={errors.il?.message}>
            <Input id="il" invalid={!!errors.il} {...register("il")} />
          </Field>
        </div>
      ) : null}

      {rol === "KOC" ? (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
          <Field
            label="Uzmanlık"
            htmlFor="uzmanlik"
            hata={errors.uzmanlik?.message}
            className="sm:col-span-2"
          >
            <Input
              id="uzmanlik"
              invalid={!!errors.uzmanlik}
              {...register("uzmanlik")}
            />
          </Field>
          <Field label="Durum" htmlFor="durum" hata={errors.durum?.message}>
            <Select
              id="durum"
              invalid={!!errors.durum}
              {...register("durum")}
            >
              {KOC_DURUMU_VALUES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      {rol === "OGRENCI" ? (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
          <Field label="İl" htmlFor="il" hata={errors.il?.message}>
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
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
