import { z } from "zod";

export const gorusmeOlusturSemasi = z.object({
  ogrenciUserId: z.string().min(1, "Öğrenci seçimi zorunlu"),
  tarih: z
    .string()
    .min(1, "Tarih zorunlu")
    .refine(
      (v) => !Number.isNaN(new Date(v).getTime()),
      "Tarih geçersiz",
    ),
  konu: z.string().max(150, "En fazla 150 karakter").optional(),
  not: z
    .string()
    .min(10, "En az 10 karakter")
    .max(4000, "En fazla 4000 karakter"),
  ilerlemePuani: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v || v.trim().length === 0) return true;
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 10;
      },
      "0–10 arası bir tam sayı olmalı",
    ),
});

export type GorusmeOlusturGirdi = z.infer<typeof gorusmeOlusturSemasi>;
