import { z } from "zod";
import { gecerliTelMi } from "@/lib/phone";

export const ROL_VALUES = [
  "ADMIN",
  "KOORDINATOR",
  "KOC",
  "OGRENCI",
  "VELI",
] as const;
export const KOC_DURUMU_VALUES = ["HAVUZ", "AKTIF", "PASIF"] as const;

const tel = z
  .string()
  .min(1, "Telefon zorunludur")
  .refine(gecerliTelMi, "Telefon geçersiz");

const opsiyonelTarih = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim().length === 0 || !Number.isNaN(new Date(v).getTime()),
    "Tarih geçersiz",
  );

const opsiyonelEmail = z
  .string()
  .optional()
  .refine(
    (v) =>
      !v || v.trim().length === 0 || z.string().email().safeParse(v).success,
    "E-posta geçersiz",
  );

const opsiyonelYazi = (max = 200) =>
  z
    .string()
    .max(max, `En fazla ${max} karakter`)
    .optional();

// Form ve server için tek, düz şema. Rol bazlı zorunluluklar refine ile
// uygulanır; böylece RHF + Zod tip eşleşmesi sorunsuz çalışır.
export const kullaniciOlusturSemasi = z
  .object({
    rol: z.enum(ROL_VALUES),
    ad: z.string().min(2, "Ad zorunludur").max(50),
    soyad: z.string().min(2, "Soyad zorunludur").max(50),
    telefon: tel,
    dogumTarihi: opsiyonelTarih,
    email: opsiyonelEmail,
    vakifAdi: opsiyonelYazi(150),
    il: opsiyonelYazi(50),
    ilce: opsiyonelYazi(50),
    sinif: opsiyonelYazi(20),
    okul: opsiyonelYazi(150),
    uzmanlik: opsiyonelYazi(100),
    durum: z.enum(KOC_DURUMU_VALUES).optional(),
    veliUserId: opsiyonelYazi(40),
  })
  .superRefine((v, ctx) => {
    if (v.rol === "KOORDINATOR") {
      if (!v.vakifAdi || v.vakifAdi.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Vakıf adı zorunludur",
          path: ["vakifAdi"],
        });
      }
    }
    if (v.rol === "OGRENCI") {
      if (!v.il || v.il.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "İl zorunludur",
          path: ["il"],
        });
      }
    }
  });

export type KullaniciOlusturGirdi = z.infer<typeof kullaniciOlusturSemasi>;

export const kullaniciDuzenleSemasi = z.object({
  ad: z.string().min(2).max(50),
  soyad: z.string().min(2).max(50),
  telefon: tel,
  dogumTarihi: opsiyonelTarih,
  email: opsiyonelEmail,
  vakifAdi: opsiyonelYazi(150),
  il: opsiyonelYazi(50),
  ilce: opsiyonelYazi(50),
  sinif: opsiyonelYazi(20),
  okul: opsiyonelYazi(150),
  uzmanlik: opsiyonelYazi(100),
  durum: z.enum(KOC_DURUMU_VALUES).optional(),
});

export type KullaniciDuzenleGirdi = z.infer<typeof kullaniciDuzenleSemasi>;
