import { z } from "zod";
import { gecerliTelMi } from "@/lib/phone";

const tel = z
  .string()
  .min(1, "Telefon zorunludur")
  .refine(gecerliTelMi, "Geçerli bir telefon numarası girin (5xxxxxxxxx)");

const opsiyonelTel = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim().length === 0 || gecerliTelMi(v),
    "Telefon geçersiz",
  );

const opsiyonelEmail = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim().length === 0 || z.string().email().safeParse(v).success,
    "E-posta geçersiz",
  );

const opsiyonelTarih = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim().length === 0 || !Number.isNaN(new Date(v).getTime()),
    "Tarih geçersiz",
  );

const yazi = (alan: string, min = 1, max = 100) =>
  z
    .string()
    .min(min, `${alan} zorunludur`)
    .max(max, `${alan} en fazla ${max} karakter olabilir`);

const opsiyonelYazi = (max = 200) =>
  z
    .string()
    .max(max, `En fazla ${max} karakter`)
    .optional();

export const ogrenciBasvuruSemasi = z.object({
  ad: yazi("Ad", 2, 50),
  soyad: yazi("Soyad", 2, 50),
  telefon: tel,
  dogumTarihi: opsiyonelTarih,
  email: opsiyonelEmail,
  il: yazi("İl", 2, 50),
  ilce: opsiyonelYazi(50),
  sinif: opsiyonelYazi(20),
  okul: opsiyonelYazi(150),
  veliAd: opsiyonelYazi(50),
  veliSoyad: opsiyonelYazi(50),
  veliTelefon: opsiyonelTel,
  notlar: opsiyonelYazi(1000),
});

export type OgrenciBasvuruGirdi = z.infer<typeof ogrenciBasvuruSemasi>;

export const kocBasvuruSemasi = z.object({
  ad: yazi("Ad", 2, 50),
  soyad: yazi("Soyad", 2, 50),
  telefon: tel,
  dogumTarihi: opsiyonelTarih,
  email: opsiyonelEmail,
  uzmanlik: opsiyonelYazi(100),
  notlar: opsiyonelYazi(1000),
});

export type KocBasvuruGirdi = z.infer<typeof kocBasvuruSemasi>;
