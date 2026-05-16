"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import {
  KOC_DURUMU_VALUES,
  kullaniciOlusturSemasi,
  ROL_VALUES,
  type KullaniciOlusturGirdi,
} from "@/lib/validation/kullanici";
import { kullaniciOlustur } from "@/server/kullanici";

type Veli = { userId: string; ad: string; soyad: string; telefon: string };

export function YeniKullaniciForm({ veliler }: { veliler: Veli[] }) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<KullaniciOlusturGirdi>({
    resolver: zodResolver(kullaniciOlusturSemasi),
    defaultValues: { rol: "OGRENCI", durum: "HAVUZ" },
    mode: "onBlur",
  });

  const rol = watch("rol");

  const onValid = (degerler: KullaniciOlusturGirdi) => {
    setHata(null);
    startTransition(async () => {
      const sonuc = await kullaniciOlustur(degerler);
      if (!sonuc.ok) {
        setHata(sonuc.hata);
        return;
      }
      router.push(`/admin/kullanicilar/${sonuc.veri.id}?olusturuldu=1`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}

      <Alert tonu="bilgi">
        Kullanıcı için otomatik bir parola üretilir ve telefonuna SMS ile
        gönderilir.
      </Alert>

      <Field label="Rol" htmlFor="rol" hata={errors.rol?.message} zorunlu>
        <Select id="rol" invalid={!!errors.rol} {...register("rol")}>
          {ROL_VALUES.map((r) => (
            <option key={r} value={r}>
              {ROL_ETIKETLERI[r]}
            </option>
          ))}
        </Select>
      </Field>

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
            placeholder="5xx xxx xx xx"
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
          <Field
            label="Veli"
            htmlFor="veliUserId"
            hata={errors.veliUserId?.message}
            className="sm:col-span-2"
            ipucu="Daha önce kayıtlı bir veli seçin. Yoksa boş bırakın, daha sonra eşleştirebilirsiniz."
          >
            <Select
              id="veliUserId"
              invalid={!!errors.veliUserId}
              {...register("veliUserId")}
            >
              <option value="">— Veli seçilmedi —</option>
              {veliler.map((v) => (
                <option key={v.userId} value={v.userId}>
                  {v.ad} {v.soyad} ({v.telefon})
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg" disabled={bekliyor}>
          {bekliyor ? "Kaydediliyor..." : "Kullanıcıyı oluştur"}
        </Button>
      </div>
    </form>
  );
}
