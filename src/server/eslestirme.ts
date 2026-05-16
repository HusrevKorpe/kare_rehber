"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";
import { bildirimGonder } from "@/server/bildirim";

export type EslestirmeSonuc =
  | { ok: true }
  | { ok: false; hata: string };

async function ogrenciProfilId(ogrenciUserId: string) {
  const op = await prisma.ogrenciProfil.findUnique({
    where: { userId: ogrenciUserId },
    select: { id: true },
  });
  return op?.id ?? null;
}

async function kocProfilId(kocUserId: string) {
  const kp = await prisma.kocProfil.findUnique({
    where: { userId: kocUserId },
    select: { id: true, durum: true },
  });
  return kp;
}

async function koordinatorProfilId(koordUserId: string) {
  const kp = await prisma.koordinatorProfil.findUnique({
    where: { userId: koordUserId },
    select: { id: true },
  });
  return kp?.id ?? null;
}

export async function ogrenciKocAta(
  ogrenciUserId: string,
  kocUserId: string,
): Promise<EslestirmeSonuc> {
  const session = await requireRole("ADMIN");

  const ogrId = await ogrenciProfilId(ogrenciUserId);
  if (!ogrId) return { ok: false, hata: "Öğrenci bulunamadı." };

  const koc = await kocProfilId(kocUserId);
  if (!koc) return { ok: false, hata: "Koç bulunamadı." };
  if (koc.durum === "PASIF") {
    return { ok: false, hata: "Koç pasif durumda. Önce aktifleştirin." };
  }

  await prisma.$transaction(async (tx) => {
    // Öğrencinin aktif koç eşleştirmesi varsa kapat.
    await tx.ogrenciKocEslestirme.updateMany({
      where: { ogrenciId: ogrId, aktif: true },
      data: { aktif: false, bitis: new Date() },
    });

    // Aynı (öğrenci, koç) için eski pasif kayıt varsa onu yeniden aç,
    // yoksa yenisini oluştur. @@unique([ogrenciId, kocId, aktif]) çakışmasını önler.
    const eski = await tx.ogrenciKocEslestirme.findFirst({
      where: { ogrenciId: ogrId, kocId: koc.id, aktif: false },
    });
    if (eski) {
      await tx.ogrenciKocEslestirme.update({
        where: { id: eski.id },
        data: { aktif: true, baslangic: new Date(), bitis: null },
      });
    } else {
      await tx.ogrenciKocEslestirme.create({
        data: { ogrenciId: ogrId, kocId: koc.id, aktif: true },
      });
    }

    // Koç durumunu AKTIF'e çek.
    if (koc.durum !== "AKTIF") {
      await tx.kocProfil.update({
        where: { id: koc.id },
        data: { durum: "AKTIF" },
      });
    }
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "eslestirme_koc_ata",
    target: ogrenciUserId,
    payload: { kocUserId },
  });

  const ogrAd = await prisma.user.findUnique({
    where: { id: ogrenciUserId },
    select: { ad: true, soyad: true },
  });
  await bildirimGonder({
    kullaniciId: kocUserId,
    tip: "ESLESTIRME",
    baslik: "Yeni öğrenci atandı",
    icerik: `${ogrAd?.ad ?? ""} ${ogrAd?.soyad ?? ""} size atandı.`,
    link: "/koc",
  });
  await bildirimGonder({
    kullaniciId: ogrenciUserId,
    tip: "ESLESTIRME",
    baslik: "Yeni koçunuz atandı",
    icerik: `Size bir koç atandı. Detay için panele bakınız.`,
    link: "/ogrenci",
  });

  revalidatePath("/admin/eslestirme");
  return { ok: true };
}

export async function ogrenciKocBitir(
  eslestirmeId: string,
): Promise<EslestirmeSonuc> {
  const session = await requireRole("ADMIN");

  const mevcut = await prisma.ogrenciKocEslestirme.findUnique({
    where: { id: eslestirmeId },
    select: { id: true, aktif: true, kocId: true },
  });
  if (!mevcut) return { ok: false, hata: "Eşleştirme bulunamadı." };
  if (!mevcut.aktif) return { ok: false, hata: "Eşleştirme zaten kapalı." };

  await prisma.$transaction(async (tx) => {
    await tx.ogrenciKocEslestirme.update({
      where: { id: eslestirmeId },
      data: { aktif: false, bitis: new Date() },
    });
    // Koçun başka aktif eşleştirmesi yoksa HAVUZ'a düşür.
    const kalan = await tx.ogrenciKocEslestirme.count({
      where: { kocId: mevcut.kocId, aktif: true },
    });
    if (kalan === 0) {
      await tx.kocProfil.update({
        where: { id: mevcut.kocId },
        data: { durum: "HAVUZ" },
      });
    }
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "eslestirme_koc_bitir",
    target: eslestirmeId,
  });

  revalidatePath("/admin/eslestirme");
  return { ok: true };
}

export async function ogrenciKoordinatorAta(
  ogrenciUserId: string,
  koordinatorUserId: string,
): Promise<EslestirmeSonuc> {
  const session = await requireRole("ADMIN");

  const ogrId = await ogrenciProfilId(ogrenciUserId);
  if (!ogrId) return { ok: false, hata: "Öğrenci bulunamadı." };

  const koordId = await koordinatorProfilId(koordinatorUserId);
  if (!koordId) return { ok: false, hata: "Koordinatör bulunamadı." };

  await prisma.$transaction(async (tx) => {
    await tx.ogrenciKoordinatorEslestirme.updateMany({
      where: { ogrenciId: ogrId, aktif: true },
      data: { aktif: false },
    });

    const eski = await tx.ogrenciKoordinatorEslestirme.findFirst({
      where: { ogrenciId: ogrId, koordinatorId: koordId, aktif: false },
    });
    if (eski) {
      await tx.ogrenciKoordinatorEslestirme.update({
        where: { id: eski.id },
        data: { aktif: true, baslangic: new Date() },
      });
    } else {
      await tx.ogrenciKoordinatorEslestirme.create({
        data: { ogrenciId: ogrId, koordinatorId: koordId, aktif: true },
      });
    }
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "eslestirme_koordinator_ata",
    target: ogrenciUserId,
    payload: { koordinatorUserId },
  });

  const ogrAdK = await prisma.user.findUnique({
    where: { id: ogrenciUserId },
    select: { ad: true, soyad: true },
  });
  await bildirimGonder({
    kullaniciId: koordinatorUserId,
    tip: "ESLESTIRME",
    baslik: "Yeni öğrenci atandı",
    icerik: `${ogrAdK?.ad ?? ""} ${ogrAdK?.soyad ?? ""} koordinatörlüğünüze atandı.`,
    link: "/koordinator",
  });

  revalidatePath("/admin/eslestirme");
  return { ok: true };
}

export async function ogrenciKoordinatorBitir(
  eslestirmeId: string,
): Promise<EslestirmeSonuc> {
  const session = await requireRole("ADMIN");

  const mevcut = await prisma.ogrenciKoordinatorEslestirme.findUnique({
    where: { id: eslestirmeId },
    select: { id: true, aktif: true },
  });
  if (!mevcut) return { ok: false, hata: "Eşleştirme bulunamadı." };
  if (!mevcut.aktif) return { ok: false, hata: "Eşleştirme zaten kapalı." };

  await prisma.ogrenciKoordinatorEslestirme.update({
    where: { id: eslestirmeId },
    data: { aktif: false },
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "eslestirme_koordinator_bitir",
    target: eslestirmeId,
  });

  revalidatePath("/admin/eslestirme");
  return { ok: true };
}
