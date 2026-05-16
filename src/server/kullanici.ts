"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hashParola, rastgeleParola } from "@/lib/parola";
import { normalizeTel } from "@/lib/phone";
import { smsGonder } from "@/lib/sms";
import {
  kullaniciDuzenleSemasi,
  kullaniciOlusturSemasi,
  type KullaniciDuzenleGirdi,
  type KullaniciOlusturGirdi,
} from "@/lib/validation/kullanici";
import { requireRole } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";

function temizYazi(v: string | undefined | null) {
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

function tarihParse(v: string | undefined | null): Date | undefined {
  const t = temizYazi(v);
  return t ? new Date(t) : undefined;
}

export type ActionSonuc<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { veri: T }))
  | { ok: false; hata: string; alanHatalari?: Record<string, string> };

function alanHatalariCikar(err: import("zod").ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const yol = issue.path.join(".") || "_";
    if (!out[yol]) out[yol] = issue.message;
  }
  return out;
}

function hosgeldinIcerik(parola: string) {
  const adi = process.env.APP_NAME ?? "KARE-Rehber";
  return `${adi}: Hesabınız oluşturuldu. Parolanız: ${parola}`;
}

function parolaSifirIcerik(parola: string) {
  const adi = process.env.APP_NAME ?? "KARE-Rehber";
  return `${adi}: Parolanız sıfırlandı. Yeni parolanız: ${parola}`;
}

export async function kullaniciOlustur(
  girdi: KullaniciOlusturGirdi,
): Promise<ActionSonuc<{ id: string }>> {
  const session = await requireRole("ADMIN");
  const parsed = kullaniciOlusturSemasi.safeParse(girdi);
  if (!parsed.success) {
    return {
      ok: false,
      hata: "Formda hatalı alanlar var.",
      alanHatalari: alanHatalariCikar(parsed.error),
    };
  }
  const v = parsed.data;
  const telefon = normalizeTel(v.telefon)!;

  // Telefon benzersiz mi?
  const cakisma = await prisma.user.findUnique({
    where: { telefon },
    select: { id: true },
  });
  if (cakisma) {
    return {
      ok: false,
      hata: "Bu telefon numarası ile bir kullanıcı zaten kayıtlı.",
      alanHatalari: { telefon: "Bu numara zaten kayıtlı" },
    };
  }

  const parola = rastgeleParola(8);
  const sifreHash = await hashParola(parola);

  let yeniId: string;
  try {
    yeniId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ad: v.ad.trim(),
          soyad: v.soyad.trim(),
          telefon,
          dogumTarihi: tarihParse(v.dogumTarihi),
          email: temizYazi(v.email),
          rol: v.rol,
          sifreHash,
        },
        select: { id: true },
      });

      switch (v.rol) {
        case "ADMIN":
          break;
        case "KOORDINATOR":
          await tx.koordinatorProfil.create({
            data: {
              userId: user.id,
              vakifAdi: (v.vakifAdi ?? "").trim(),
              il: temizYazi(v.il),
            },
          });
          break;
        case "KOC":
          await tx.kocProfil.create({
            data: {
              userId: user.id,
              uzmanlik: temizYazi(v.uzmanlik),
              durum: v.durum ?? "HAVUZ",
            },
          });
          break;
        case "OGRENCI": {
          let veliId: string | undefined;
          const veliUid = temizYazi(v.veliUserId);
          if (veliUid) {
            const veli = await tx.veliProfil.findUnique({
              where: { userId: veliUid },
              select: { id: true },
            });
            veliId = veli?.id;
          }
          await tx.ogrenciProfil.create({
            data: {
              userId: user.id,
              il: (v.il ?? "").trim(),
              ilce: temizYazi(v.ilce),
              sinif: temizYazi(v.sinif),
              okul: temizYazi(v.okul),
              veliId,
            },
          });
          break;
        }
        case "VELI":
          await tx.veliProfil.create({ data: { userId: user.id } });
          break;
      }

      return user.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, hata: "Telefon veya e-posta benzersiz olmalı." };
    }
    throw e;
  }

  await smsGonder({
    aliciTel: telefon,
    aliciUserId: yeniId,
    icerik: hosgeldinIcerik(parola),
    gonderenId: session.user.id,
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "kullanici_olustur",
    target: yeniId,
    payload: { rol: v.rol, telefon },
  });

  revalidatePath("/admin/kullanicilar");
  return { ok: true, veri: { id: yeniId } };
}

export async function kullaniciGuncelle(
  id: string,
  girdi: KullaniciDuzenleGirdi,
): Promise<ActionSonuc> {
  const session = await requireRole("ADMIN");
  const parsed = kullaniciDuzenleSemasi.safeParse(girdi);
  if (!parsed.success) {
    return {
      ok: false,
      hata: "Formda hatalı alanlar var.",
      alanHatalari: alanHatalariCikar(parsed.error),
    };
  }
  const v = parsed.data;
  const telefon = normalizeTel(v.telefon)!;

  const mevcut = await prisma.user.findUnique({
    where: { id },
    select: { id: true, rol: true, telefon: true },
  });
  if (!mevcut) return { ok: false, hata: "Kullanıcı bulunamadı." };

  if (telefon !== mevcut.telefon) {
    const cakisma = await prisma.user.findUnique({
      where: { telefon },
      select: { id: true },
    });
    if (cakisma && cakisma.id !== id) {
      return {
        ok: false,
        hata: "Bu telefon numarası başka kullanıcıda mevcut.",
        alanHatalari: { telefon: "Bu numara başka kullanıcıda kayıtlı" },
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ad: v.ad.trim(),
          soyad: v.soyad.trim(),
          telefon,
          dogumTarihi: tarihParse(v.dogumTarihi),
          email: temizYazi(v.email),
        },
      });

      switch (mevcut.rol) {
        case "KOORDINATOR":
          await tx.koordinatorProfil.update({
            where: { userId: id },
            data: {
              vakifAdi: temizYazi(v.vakifAdi),
              il: temizYazi(v.il),
            },
          });
          break;
        case "KOC":
          await tx.kocProfil.update({
            where: { userId: id },
            data: {
              uzmanlik: temizYazi(v.uzmanlik),
              durum: v.durum ?? undefined,
            },
          });
          break;
        case "OGRENCI":
          await tx.ogrenciProfil.update({
            where: { userId: id },
            data: {
              il: temizYazi(v.il),
              ilce: temizYazi(v.ilce),
              sinif: temizYazi(v.sinif),
              okul: temizYazi(v.okul),
            },
          });
          break;
        case "ADMIN":
        case "VELI":
          break;
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, hata: "Telefon veya e-posta benzersiz olmalı." };
    }
    throw e;
  }

  await sistemLogYaz({
    actorId: session.user.id,
    action: "kullanici_guncelle",
    target: id,
  });

  revalidatePath("/admin/kullanicilar");
  revalidatePath(`/admin/kullanicilar/${id}`);
  return { ok: true };
}

export async function kullaniciAktifDegistir(
  id: string,
): Promise<ActionSonuc<{ aktif: boolean }>> {
  const session = await requireRole("ADMIN");

  if (session.user.id === id) {
    return { ok: false, hata: "Kendi hesabınızı pasifleştiremezsiniz." };
  }

  const mevcut = await prisma.user.findUnique({
    where: { id },
    select: { aktif: true },
  });
  if (!mevcut) return { ok: false, hata: "Kullanıcı bulunamadı." };

  const yeniAktif = !mevcut.aktif;
  await prisma.user.update({
    where: { id },
    data: { aktif: yeniAktif },
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: yeniAktif ? "kullanici_aktiflestir" : "kullanici_pasiflestir",
    target: id,
  });

  revalidatePath("/admin/kullanicilar");
  revalidatePath(`/admin/kullanicilar/${id}`);
  return { ok: true, veri: { aktif: yeniAktif } };
}

export async function parolaSifirla(id: string): Promise<ActionSonuc> {
  const session = await requireRole("ADMIN");

  const mevcut = await prisma.user.findUnique({
    where: { id },
    select: { id: true, telefon: true },
  });
  if (!mevcut) return { ok: false, hata: "Kullanıcı bulunamadı." };

  const parola = rastgeleParola(8);
  const sifreHash = await hashParola(parola);

  await prisma.user.update({
    where: { id },
    data: { sifreHash },
  });

  await smsGonder({
    aliciTel: mevcut.telefon,
    aliciUserId: mevcut.id,
    icerik: parolaSifirIcerik(parola),
    gonderenId: session.user.id,
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "parola_sifirla",
    target: id,
  });

  return { ok: true };
}
