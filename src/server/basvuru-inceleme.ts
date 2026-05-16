"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hashParola, rastgeleParola } from "@/lib/parola";
import { smsGonder } from "@/lib/sms";
import { requireRole } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";
import { bildirimGonder } from "@/server/bildirim";

export type IncelemeSonuc =
  | { ok: true }
  | { ok: false; hata: string };

function hosgeldinIcerik(parola: string) {
  const adi = process.env.APP_NAME ?? "KARE-Rehber";
  return `${adi}: Hesabınız oluşturuldu. Parolanız: ${parola}`;
}

function redIcerik(rolEtiketi: string, sebep?: string | null) {
  const adi = process.env.APP_NAME ?? "KARE-Rehber";
  const sebepKisim = sebep ? ` Sebep: ${sebep}` : "";
  return `${adi}: ${rolEtiketi} başvurunuz kabul edilmedi.${sebepKisim}`;
}

export async function ogrenciOnayla(basvuruId: string): Promise<IncelemeSonuc> {
  const session = await requireRole("ADMIN");

  const basvuru = await prisma.ogrenciKayitBasvuru.findUnique({
    where: { id: basvuruId },
  });
  if (!basvuru) return { ok: false, hata: "Başvuru bulunamadı." };
  if (basvuru.durum !== "BEKLEMEDE") {
    return { ok: false, hata: "Başvuru zaten incelenmiş." };
  }

  // Öğrenci telefonu uygun mu?
  const ogrenciCakisma = await prisma.user.findUnique({
    where: { telefon: basvuru.telefon },
    select: { id: true, rol: true },
  });
  if (ogrenciCakisma) {
    return {
      ok: false,
      hata: `Öğrenci telefonu (${basvuru.telefon}) zaten bir kullanıcıda kayıtlı.`,
    };
  }

  // Veli telefonu varsa: varsa VELI olmalı, yoksa yeni VELI oluştur.
  let veliMevcutId: string | null = null;
  let veliYeniOlusturulacak: {
    ad: string;
    soyad: string;
    telefon: string;
    parola: string;
    sifreHash: string;
  } | null = null;

  if (basvuru.veliTelefon) {
    const veliCakisma = await prisma.user.findUnique({
      where: { telefon: basvuru.veliTelefon },
      select: { id: true, rol: true, veliProfil: { select: { id: true } } },
    });
    if (veliCakisma) {
      if (veliCakisma.rol !== "VELI") {
        return {
          ok: false,
          hata: `Veli telefonu (${basvuru.veliTelefon}) farklı bir rol için kullanılıyor.`,
        };
      }
      veliMevcutId = veliCakisma.veliProfil?.id ?? null;
    } else {
      const veliParola = rastgeleParola(8);
      veliYeniOlusturulacak = {
        ad: basvuru.veliAd ?? "Veli",
        soyad: basvuru.veliSoyad ?? "",
        telefon: basvuru.veliTelefon,
        parola: veliParola,
        sifreHash: await hashParola(veliParola),
      };
    }
  }

  const ogrenciParola = rastgeleParola(8);
  const ogrenciSifreHash = await hashParola(ogrenciParola);

  let yeniOgrenciId: string;
  let veliKullaniciId: string | null = null;
  let yaratilanVeliParola: string | null = null;

  try {
    const sonuc = await prisma.$transaction(async (tx) => {
      let veliId: string | null = veliMevcutId;
      let veliUid: string | null = null;

      if (veliYeniOlusturulacak) {
        const veliUser = await tx.user.create({
          data: {
            ad: veliYeniOlusturulacak.ad,
            soyad: veliYeniOlusturulacak.soyad,
            telefon: veliYeniOlusturulacak.telefon,
            rol: "VELI",
            sifreHash: veliYeniOlusturulacak.sifreHash,
          },
          select: { id: true },
        });
        const veliProfil = await tx.veliProfil.create({
          data: { userId: veliUser.id },
          select: { id: true },
        });
        veliId = veliProfil.id;
        veliUid = veliUser.id;
      }

      const ogrenciUser = await tx.user.create({
        data: {
          ad: basvuru.ad,
          soyad: basvuru.soyad,
          telefon: basvuru.telefon,
          dogumTarihi: basvuru.dogumTarihi,
          email: basvuru.email,
          rol: "OGRENCI",
          sifreHash: ogrenciSifreHash,
        },
        select: { id: true },
      });

      await tx.ogrenciProfil.create({
        data: {
          userId: ogrenciUser.id,
          il: basvuru.il,
          ilce: basvuru.ilce,
          sinif: basvuru.sinif,
          okul: basvuru.okul,
          veliId: veliId ?? undefined,
        },
      });

      await tx.ogrenciKayitBasvuru.update({
        where: { id: basvuru.id },
        data: {
          durum: "ONAYLANDI",
          inceleyenId: session.user.id,
          incelemeTarihi: new Date(),
        },
      });

      return { ogrenciUserId: ogrenciUser.id, veliUserId: veliUid };
    });

    yeniOgrenciId = sonuc.ogrenciUserId;
    veliKullaniciId = sonuc.veliUserId;
    if (veliYeniOlusturulacak) {
      yaratilanVeliParola = veliYeniOlusturulacak.parola;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, hata: "Telefon veya e-posta benzersiz olmalı." };
    }
    throw e;
  }

  await smsGonder({
    aliciTel: basvuru.telefon,
    aliciUserId: yeniOgrenciId,
    icerik: hosgeldinIcerik(ogrenciParola),
    gonderenId: session.user.id,
  });

  if (veliKullaniciId && yaratilanVeliParola && basvuru.veliTelefon) {
    await smsGonder({
      aliciTel: basvuru.veliTelefon,
      aliciUserId: veliKullaniciId,
      icerik: hosgeldinIcerik(yaratilanVeliParola),
      gonderenId: session.user.id,
    });
  }

  await sistemLogYaz({
    actorId: session.user.id,
    action: "ogrenci_basvuru_onayla",
    target: basvuru.id,
    payload: { ogrenciUserId: yeniOgrenciId, veliUserId: veliKullaniciId },
  });

  await bildirimGonder({
    kullaniciId: yeniOgrenciId,
    tip: "BASVURU_ONAYLANDI",
    baslik: "Hesabınız oluşturuldu",
    icerik: "Öğrenci başvurunuz onaylandı. Panele giriş yapabilirsiniz.",
    link: "/ogrenci",
  });
  if (veliKullaniciId) {
    await bildirimGonder({
      kullaniciId: veliKullaniciId,
      tip: "BASVURU_ONAYLANDI",
      baslik: "Hesabınız oluşturuldu",
      icerik: "Velilik hesabınız oluşturuldu.",
      link: "/veli",
    });
  }

  revalidatePath("/admin/basvurular/ogrenci");
  revalidatePath("/admin/kullanicilar");
  revalidatePath("/admin");
  return { ok: true };
}

export async function ogrenciReddet(
  basvuruId: string,
  sebep?: string,
): Promise<IncelemeSonuc> {
  const session = await requireRole("ADMIN");

  const basvuru = await prisma.ogrenciKayitBasvuru.findUnique({
    where: { id: basvuruId },
  });
  if (!basvuru) return { ok: false, hata: "Başvuru bulunamadı." };
  if (basvuru.durum !== "BEKLEMEDE") {
    return { ok: false, hata: "Başvuru zaten incelenmiş." };
  }

  await prisma.ogrenciKayitBasvuru.update({
    where: { id: basvuruId },
    data: {
      durum: "REDDEDILDI",
      inceleyenId: session.user.id,
      incelemeTarihi: new Date(),
      notlar: sebep
        ? `${basvuru.notlar ? basvuru.notlar + "\n\n" : ""}[RED] ${sebep}`
        : basvuru.notlar,
    },
  });

  // İsteğe bağlı: ret SMS'i. Adayın anlamlı bilgi alması için gönderiyoruz.
  await smsGonder({
    aliciTel: basvuru.telefon,
    icerik: redIcerik("Öğrenci", sebep),
    gonderenId: session.user.id,
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "ogrenci_basvuru_reddet",
    target: basvuru.id,
    payload: { sebep },
  });

  revalidatePath("/admin/basvurular/ogrenci");
  revalidatePath("/admin");
  return { ok: true };
}

export async function kocOnayla(basvuruId: string): Promise<IncelemeSonuc> {
  const session = await requireRole("ADMIN");

  const basvuru = await prisma.kocOnBasvuru.findUnique({
    where: { id: basvuruId },
  });
  if (!basvuru) return { ok: false, hata: "Başvuru bulunamadı." };
  if (basvuru.durum !== "BEKLEMEDE") {
    return { ok: false, hata: "Başvuru zaten incelenmiş." };
  }

  const cakisma = await prisma.user.findUnique({
    where: { telefon: basvuru.telefon },
    select: { id: true },
  });
  if (cakisma) {
    return {
      ok: false,
      hata: `Telefon (${basvuru.telefon}) zaten bir kullanıcıda kayıtlı.`,
    };
  }

  const parola = rastgeleParola(8);
  const sifreHash = await hashParola(parola);

  let yeniKocId: string;
  try {
    const sonuc = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ad: basvuru.ad,
          soyad: basvuru.soyad,
          telefon: basvuru.telefon,
          dogumTarihi: basvuru.dogumTarihi,
          email: basvuru.email,
          rol: "KOC",
          sifreHash,
        },
        select: { id: true },
      });
      await tx.kocProfil.create({
        data: {
          userId: user.id,
          uzmanlik: basvuru.uzmanlik,
          durum: "HAVUZ",
        },
      });
      await tx.kocOnBasvuru.update({
        where: { id: basvuru.id },
        data: {
          durum: "ONAYLANDI",
          inceleyenId: session.user.id,
          incelemeTarihi: new Date(),
        },
      });
      return user.id;
    });
    yeniKocId = sonuc;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, hata: "Telefon veya e-posta benzersiz olmalı." };
    }
    throw e;
  }

  await smsGonder({
    aliciTel: basvuru.telefon,
    aliciUserId: yeniKocId,
    icerik: hosgeldinIcerik(parola),
    gonderenId: session.user.id,
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "koc_basvuru_onayla",
    target: basvuru.id,
    payload: { kocUserId: yeniKocId },
  });

  await bildirimGonder({
    kullaniciId: yeniKocId,
    tip: "BASVURU_ONAYLANDI",
    baslik: "Hesabınız oluşturuldu",
    icerik: "Koç başvurunuz onaylandı. Panele giriş yapabilirsiniz.",
    link: "/koc",
  });

  revalidatePath("/admin/basvurular/koc");
  revalidatePath("/admin/kullanicilar");
  revalidatePath("/admin");
  return { ok: true };
}

export async function kocReddet(
  basvuruId: string,
  sebep?: string,
): Promise<IncelemeSonuc> {
  const session = await requireRole("ADMIN");

  const basvuru = await prisma.kocOnBasvuru.findUnique({
    where: { id: basvuruId },
  });
  if (!basvuru) return { ok: false, hata: "Başvuru bulunamadı." };
  if (basvuru.durum !== "BEKLEMEDE") {
    return { ok: false, hata: "Başvuru zaten incelenmiş." };
  }

  await prisma.kocOnBasvuru.update({
    where: { id: basvuruId },
    data: {
      durum: "REDDEDILDI",
      inceleyenId: session.user.id,
      incelemeTarihi: new Date(),
      notlar: sebep
        ? `${basvuru.notlar ? basvuru.notlar + "\n\n" : ""}[RED] ${sebep}`
        : basvuru.notlar,
    },
  });

  await smsGonder({
    aliciTel: basvuru.telefon,
    icerik: redIcerik("Koç", sebep),
    gonderenId: session.user.id,
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "koc_basvuru_reddet",
    target: basvuru.id,
    payload: { sebep },
  });

  revalidatePath("/admin/basvurular/koc");
  revalidatePath("/admin");
  return { ok: true };
}
