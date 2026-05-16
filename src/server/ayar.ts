"use server";

import { revalidatePath } from "next/cache";
import {
  AYAR_ANAHTARLARI,
  AYAR_VARSAYILANLARI,
} from "@/lib/ayar-anahtarlar";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";

export type AyarSonuc =
  | { ok: true }
  | { ok: false; hata: string; alanHatalari?: Record<string, string> };

export async function ayarOku(anahtar: string): Promise<string> {
  const k = await prisma.ayar.findUnique({
    where: { anahtar },
    select: { deger: true },
  });
  return k?.deger ?? AYAR_VARSAYILANLARI[anahtar] ?? "";
}

export async function ayarlariOku() {
  const anahtarlar = Object.values(AYAR_ANAHTARLARI);
  const kayitlar = await prisma.ayar.findMany({
    where: { anahtar: { in: anahtarlar } },
  });
  const map = new Map(kayitlar.map((k) => [k.anahtar, k.deger]));
  return anahtarlar.reduce<Record<string, string>>((acc, a) => {
    acc[a] = map.get(a) ?? AYAR_VARSAYILANLARI[a] ?? "";
    return acc;
  }, {});
}

export async function ayarlariKaydet(input: {
  gorusmePeriyotGun: string;
  appAdi: string;
}): Promise<AyarSonuc> {
  const session = await requireRole("ADMIN");

  const hatalar: Record<string, string> = {};
  const periyotN = Number(input.gorusmePeriyotGun);
  if (
    !Number.isInteger(periyotN) ||
    periyotN < 1 ||
    periyotN > 365
  ) {
    hatalar.gorusmePeriyotGun = "1–365 arası bir tam sayı olmalı";
  }
  const adi = input.appAdi.trim();
  if (adi.length < 2 || adi.length > 60) {
    hatalar.appAdi = "Uygulama adı 2–60 karakter olmalı";
  }
  if (Object.keys(hatalar).length > 0) {
    return { ok: false, hata: "Formda hatalı alanlar var.", alanHatalari: hatalar };
  }

  await prisma.$transaction([
    prisma.ayar.upsert({
      where: { anahtar: AYAR_ANAHTARLARI.gorusmePeriyotGun },
      update: { deger: String(periyotN) },
      create: {
        anahtar: AYAR_ANAHTARLARI.gorusmePeriyotGun,
        deger: String(periyotN),
        aciklama: "Görüşmeler arası varsayılan periyot (gün).",
      },
    }),
    prisma.ayar.upsert({
      where: { anahtar: AYAR_ANAHTARLARI.appAdi },
      update: { deger: adi },
      create: {
        anahtar: AYAR_ANAHTARLARI.appAdi,
        deger: adi,
        aciklama: "SMS ve UI'da görünen uygulama adı.",
      },
    }),
  ]);

  await sistemLogYaz({
    actorId: session.user.id,
    action: "ayar_kaydet",
    payload: { gorusmePeriyotGun: periyotN, appAdi: adi },
  });

  revalidatePath("/admin/ayarlar");
  return { ok: true };
}

export async function gorusmePeriyotGun(): Promise<number> {
  await requireSession();
  const v = await ayarOku(AYAR_ANAHTARLARI.gorusmePeriyotGun);
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 14;
}
