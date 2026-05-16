"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  gorusmeOlusturSemasi,
  type GorusmeOlusturGirdi,
} from "@/lib/validation/gorusme";
import { requireRole, requireSession } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";
import { bildirimGonder, rolBazliBildirim } from "@/server/bildirim";

export type GorusmeSonuc<T = undefined> =
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

export async function gorusmeOlustur(
  girdi: GorusmeOlusturGirdi,
): Promise<GorusmeSonuc<{ id: string }>> {
  const session = await requireRole("KOC");
  const parsed = gorusmeOlusturSemasi.safeParse(girdi);
  if (!parsed.success) {
    return {
      ok: false,
      hata: "Formda hatalı alanlar var.",
      alanHatalari: alanHatalariCikar(parsed.error),
    };
  }
  const v = parsed.data;

  // Koç profilini bul.
  const kocProfil = await prisma.kocProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!kocProfil) {
    return { ok: false, hata: "Koç profili bulunamadı." };
  }

  // Öğrenci, bu koça aktif olarak atanmış mı?
  const ogrenciProfil = await prisma.ogrenciProfil.findUnique({
    where: { userId: v.ogrenciUserId },
    select: { id: true },
  });
  if (!ogrenciProfil) {
    return { ok: false, hata: "Öğrenci bulunamadı." };
  }

  const eslestirme = await prisma.ogrenciKocEslestirme.findFirst({
    where: {
      ogrenciId: ogrenciProfil.id,
      kocId: kocProfil.id,
      aktif: true,
    },
    select: { id: true },
  });
  if (!eslestirme) {
    return {
      ok: false,
      hata: "Bu öğrenci size atanmamış. Lütfen koordinatörünüzle iletişime geçin.",
    };
  }

  const ilerleme =
    v.ilerlemePuani && v.ilerlemePuani.trim().length > 0
      ? Number(v.ilerlemePuani)
      : null;

  const yeni = await prisma.gorusme.create({
    data: {
      kocId: kocProfil.id,
      ogrenciId: ogrenciProfil.id,
      tarih: new Date(v.tarih),
      konu: v.konu?.trim() || null,
      not: v.not.trim(),
      ilerlemePuani: ilerleme,
      durum: "GONDERILDI",
    },
    select: { id: true },
  });

  await prisma.gorusmeLog.create({
    data: {
      gorusmeId: yeni.id,
      degistirenId: session.user.id,
      aciklama: "Görüşme oluşturuldu (admin onayı bekliyor)",
      yeniVeri: {
        tarih: v.tarih,
        konu: v.konu ?? null,
        ilerlemePuani: ilerleme,
      },
    },
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "gorusme_olustur",
    target: yeni.id,
  });

  const ogrAd = await prisma.user.findUnique({
    where: { id: v.ogrenciUserId },
    select: { ad: true, soyad: true },
  });
  await rolBazliBildirim(["ADMIN"], {
    tip: "GORUSME_GONDERILDI",
    baslik: "Yeni görüşme onayı bekliyor",
    icerik: `${ogrAd?.ad ?? ""} ${ogrAd?.soyad ?? ""} için yeni görüşme kaydı`,
    link: `/admin/gorusmeler`,
  });

  revalidatePath("/koc/gorusmeler");
  revalidatePath("/admin/gorusmeler");
  return { ok: true, veri: { id: yeni.id } };
}

export async function gorusmeOnayla(
  id: string,
): Promise<GorusmeSonuc> {
  const session = await requireRole("ADMIN");

  const mevcut = await prisma.gorusme.findUnique({
    where: { id },
    select: { id: true, durum: true },
  });
  if (!mevcut) return { ok: false, hata: "Görüşme bulunamadı." };
  if (mevcut.durum === "ONAYLANDI") {
    return { ok: false, hata: "Görüşme zaten onaylanmış." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.gorusme.update({
      where: { id },
      data: {
        durum: "ONAYLANDI",
        onaylayanId: session.user.id,
        onayTarihi: new Date(),
        redSebebi: null,
      },
    });
    await tx.gorusmeLog.create({
      data: {
        gorusmeId: id,
        degistirenId: session.user.id,
        aciklama: "Görüşme onaylandı",
      },
    });
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "gorusme_onayla",
    target: id,
  });

  const detay = await prisma.gorusme.findUnique({
    where: { id },
    select: {
      tarih: true,
      koc: { select: { user: { select: { id: true } } } },
      ogrenci: {
        select: {
          user: { select: { id: true, ad: true, soyad: true } },
          veli: { select: { user: { select: { id: true } } } },
        },
      },
    },
  });
  if (detay) {
    const tarihStr = detay.tarih.toLocaleDateString("tr-TR");
    const ogrAdSoyad = `${detay.ogrenci.user.ad} ${detay.ogrenci.user.soyad}`;
    await bildirimGonder({
      kullaniciId: detay.koc.user.id,
      tip: "GORUSME_ONAYLANDI",
      baslik: "Görüşmeniz onaylandı",
      icerik: `${ogrAdSoyad} (${tarihStr}) görüşmesi onaylandı.`,
      link: `/koc/gorusmeler`,
    });
    await bildirimGonder({
      kullaniciId: detay.ogrenci.user.id,
      tip: "GORUSME_ONAYLANDI",
      baslik: "Görüşme kaydı",
      icerik: `${tarihStr} tarihli görüşme kaydı eklendi.`,
      link: `/ogrenci/gorusmelerim`,
    });
    if (detay.ogrenci.veli?.user.id) {
      await bildirimGonder({
        kullaniciId: detay.ogrenci.veli.user.id,
        tip: "GORUSME_ONAYLANDI",
        baslik: "Görüşme kaydı",
        icerik: `${ogrAdSoyad} için ${tarihStr} tarihli görüşme kaydı.`,
        link: `/veli/gorusmeler`,
      });
    }
  }

  revalidatePath("/admin/gorusmeler");
  revalidatePath("/koc/gorusmeler");
  return { ok: true };
}

export async function gorusmeReddet(
  id: string,
  sebep?: string,
): Promise<GorusmeSonuc> {
  const session = await requireRole("ADMIN");

  const mevcut = await prisma.gorusme.findUnique({
    where: { id },
    select: { id: true, durum: true },
  });
  if (!mevcut) return { ok: false, hata: "Görüşme bulunamadı." };
  if (mevcut.durum === "REDDEDILDI") {
    return { ok: false, hata: "Görüşme zaten reddedilmiş." };
  }

  const temizSebep = sebep?.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.gorusme.update({
      where: { id },
      data: {
        durum: "REDDEDILDI",
        onaylayanId: session.user.id,
        onayTarihi: new Date(),
        redSebebi: temizSebep,
      },
    });
    await tx.gorusmeLog.create({
      data: {
        gorusmeId: id,
        degistirenId: session.user.id,
        aciklama: temizSebep
          ? `Görüşme reddedildi: ${temizSebep}`
          : "Görüşme reddedildi",
      },
    });
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "gorusme_reddet",
    target: id,
    payload: { sebep: temizSebep },
  });

  const detayR = await prisma.gorusme.findUnique({
    where: { id },
    select: {
      koc: { select: { user: { select: { id: true } } } },
      ogrenci: { select: { user: { select: { ad: true, soyad: true } } } },
    },
  });
  if (detayR) {
    const ogrAdSoyad = `${detayR.ogrenci.user.ad} ${detayR.ogrenci.user.soyad}`;
    await bildirimGonder({
      kullaniciId: detayR.koc.user.id,
      tip: "GORUSME_REDDEDILDI",
      baslik: "Görüşmeniz reddedildi",
      icerik: temizSebep
        ? `${ogrAdSoyad} görüşmesi reddedildi: ${temizSebep}`
        : `${ogrAdSoyad} görüşmesi reddedildi.`,
      link: `/koc/gorusmeler`,
    });
  }

  revalidatePath("/admin/gorusmeler");
  revalidatePath("/koc/gorusmeler");
  return { ok: true };
}

/**
 * Aktif kullanıcının görmesi gereken görüşme listesini döner.
 * Rol bazlı filtreleri merkezi tutar — sayfalar bunu çağırır.
 */
export async function gorusmeleriListele(opts?: {
  durum?: "TASLAK" | "GONDERILDI" | "ONAYLANDI" | "REDDEDILDI";
  limit?: number;
}) {
  const session = await requireSession();
  const rol = session.user.rol;
  const limit = opts?.limit ?? 100;

  const durumFilt = opts?.durum ? { durum: opts.durum } : {};

  if (rol === "ADMIN") {
    return prisma.gorusme.findMany({
      where: durumFilt,
      orderBy: [{ tarih: "desc" }],
      take: limit,
      include: {
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
      },
    });
  }

  if (rol === "KOC") {
    const kp = await prisma.kocProfil.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!kp) return [];
    return prisma.gorusme.findMany({
      where: { kocId: kp.id, ...durumFilt },
      orderBy: [{ tarih: "desc" }],
      take: limit,
      include: {
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
      },
    });
  }

  if (rol === "KOORDINATOR") {
    const kp = await prisma.koordinatorProfil.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!kp) return [];
    // Kendi aktif eşleştirmelerindeki öğrencilerin görüşmeleri.
    return prisma.gorusme.findMany({
      where: {
        ogrenci: {
          koordinatorEslestirmeleri: {
            some: { koordinatorId: kp.id, aktif: true },
          },
        },
        ...durumFilt,
      },
      orderBy: [{ tarih: "desc" }],
      take: limit,
      include: {
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
      },
    });
  }

  if (rol === "OGRENCI") {
    const op = await prisma.ogrenciProfil.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!op) return [];
    // Öğrenci sadece ONAYLANDI olanları görür.
    return prisma.gorusme.findMany({
      where: { ogrenciId: op.id, durum: "ONAYLANDI" },
      orderBy: [{ tarih: "desc" }],
      take: limit,
      include: {
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
      },
    });
  }

  if (rol === "VELI") {
    const vp = await prisma.veliProfil.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!vp) return [];
    return prisma.gorusme.findMany({
      where: {
        ogrenci: { veliId: vp.id },
        durum: "ONAYLANDI",
      },
      orderBy: [{ tarih: "desc" }],
      take: limit,
      include: {
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
      },
    });
  }

  return [];
}

/**
 * Koçun yeni görüşme açabileceği (aktif eşleşmeli) öğrenci listesi.
 */
export async function kocAktifOgrencileri() {
  const session = await requireRole("KOC");
  const kp = await prisma.kocProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!kp) return [];
  const eslesmeler = await prisma.ogrenciKocEslestirme.findMany({
    where: { kocId: kp.id, aktif: true },
    include: {
      ogrenci: {
        include: { user: { select: { id: true, ad: true, soyad: true } } },
      },
    },
    orderBy: { baslangic: "desc" },
  });
  return eslesmeler.map((e) => ({
    userId: e.ogrenci.user.id,
    ad: e.ogrenci.user.ad,
    soyad: e.ogrenci.user.soyad,
  }));
}
