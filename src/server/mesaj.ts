"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/server/auth";
import { sistemLogYaz } from "@/server/log";
import { bildirimGonder } from "@/server/bildirim";
import { ROL_PANELLERI } from "@/lib/permissions";
import {
  aliciAdaylariIcin,
  mesajIzinli,
  type AliciAdayi,
} from "@/lib/mesajlasma-yetkisi";
import type { Rol } from "@/generated/prisma/enums";

export type MesajSonuc<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { veri: T }))
  | { ok: false; hata: string };

export type Konusma = {
  partner: { id: string; ad: string; soyad: string; rol: Rol };
  sonMesaj: {
    id: string;
    icerik: string;
    konu: string | null;
    tarih: Date;
    okundu: boolean;
    bendenMi: boolean;
  };
  okunmamis: number;
};

export type ThreadMesaj = {
  id: string;
  konu: string | null;
  icerik: string;
  tarih: Date;
  okundu: boolean;
  okunmaTarihi: Date | null;
  bendenMi: boolean;
};

function revalidateMesajlar() {
  revalidatePath("/admin/mesajlar");
  revalidatePath("/koc/mesajlar");
  revalidatePath("/koordinator/mesajlar");
  revalidatePath("/ogrenci/mesajlar");
  revalidatePath("/veli/mesajlar");
}

export async function aliciAdaylari(): Promise<AliciAdayi[]> {
  const session = await requireSession();
  return aliciAdaylariIcin(session.user.id, session.user.rol);
}

export async function okunmamisMesajSayisi(): Promise<number> {
  const session = await requireSession();
  return prisma.mesaj.count({
    where: { aliciId: session.user.id, okundu: false },
  });
}

export async function mesajKonusmalar(): Promise<Konusma[]> {
  const session = await requireSession();
  const me = session.user.id;

  // Son N mesajı çek, JS'te partner'a göre grupla. Hacim büyürse SQL'e taşınır.
  const mesajlar = await prisma.mesaj.findMany({
    where: { OR: [{ gondericiId: me }, { aliciId: me }] },
    orderBy: { tarih: "desc" },
    take: 500,
    select: {
      id: true,
      gondericiId: true,
      aliciId: true,
      icerik: true,
      konu: true,
      okundu: true,
      tarih: true,
      gonderici: { select: { id: true, ad: true, soyad: true, rol: true } },
      alici: { select: { id: true, ad: true, soyad: true, rol: true } },
    },
  });

  type Acc = {
    partner: { id: string; ad: string; soyad: string; rol: Rol };
    sonMesaj: Konusma["sonMesaj"];
    okunmamis: number;
  };
  const harita = new Map<string, Acc>();

  for (const m of mesajlar) {
    const partner = m.gondericiId === me ? m.alici : m.gonderici;
    const mevcut = harita.get(partner.id);
    const bendenMi = m.gondericiId === me;
    const okunmamisArtis = !bendenMi && !m.okundu ? 1 : 0;

    if (!mevcut) {
      harita.set(partner.id, {
        partner: {
          id: partner.id,
          ad: partner.ad,
          soyad: partner.soyad,
          rol: partner.rol,
        },
        sonMesaj: {
          id: m.id,
          icerik: m.icerik,
          konu: m.konu,
          tarih: m.tarih,
          okundu: m.okundu,
          bendenMi,
        },
        okunmamis: okunmamisArtis,
      });
    } else {
      mevcut.okunmamis += okunmamisArtis;
    }
  }

  return [...harita.values()].sort(
    (a, b) => b.sonMesaj.tarih.getTime() - a.sonMesaj.tarih.getTime(),
  );
}

export async function mesajKonusma(partnerId: string): Promise<{
  partner: { id: string; ad: string; soyad: string; rol: Rol } | null;
  mesajlar: ThreadMesaj[];
}> {
  const session = await requireSession();
  const me = session.user.id;

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, ad: true, soyad: true, rol: true, aktif: true },
  });
  if (!partner) return { partner: null, mesajlar: [] };

  const ham = await prisma.mesaj.findMany({
    where: {
      OR: [
        { gondericiId: me, aliciId: partnerId },
        { gondericiId: partnerId, aliciId: me },
      ],
    },
    orderBy: { tarih: "asc" },
    select: {
      id: true,
      gondericiId: true,
      konu: true,
      icerik: true,
      tarih: true,
      okundu: true,
      okunmaTarihi: true,
    },
  });

  // Açılışta tüm gelen okunmamışları okundu işaretle.
  const okunacakIdler = ham
    .filter((m) => m.gondericiId === partnerId && !m.okundu)
    .map((m) => m.id);
  if (okunacakIdler.length > 0) {
    await prisma.mesaj.updateMany({
      where: { id: { in: okunacakIdler } },
      data: { okundu: true, okunmaTarihi: new Date() },
    });
  }

  const mesajlar: ThreadMesaj[] = ham.map((m) => ({
    id: m.id,
    konu: m.konu,
    icerik: m.icerik,
    tarih: m.tarih,
    okundu: m.gondericiId === partnerId ? true : m.okundu,
    okunmaTarihi:
      m.gondericiId === partnerId && !m.okundu
        ? new Date()
        : m.okunmaTarihi,
    bendenMi: m.gondericiId === me,
  }));

  return {
    partner: {
      id: partner.id,
      ad: partner.ad,
      soyad: partner.soyad,
      rol: partner.rol,
    },
    mesajlar,
  };
}

export async function mesajGonder(input: {
  aliciId: string;
  konu?: string;
  icerik: string;
}): Promise<MesajSonuc<{ id: string }>> {
  const session = await requireSession();

  const icerik = input.icerik?.trim() ?? "";
  if (icerik.length < 1) {
    return { ok: false, hata: "Mesaj boş olamaz." };
  }
  if (icerik.length > 4000) {
    return { ok: false, hata: "Mesaj en fazla 4000 karakter olabilir." };
  }
  if (input.aliciId === session.user.id) {
    return { ok: false, hata: "Kendinize mesaj gönderemezsiniz." };
  }

  const izin = await mesajIzinli(
    session.user.id,
    session.user.rol,
    input.aliciId,
  );
  if (!izin) {
    return {
      ok: false,
      hata: "Bu kullanıcıyla mesajlaşma yetkiniz yok.",
    };
  }

  const alici = await prisma.user.findUnique({
    where: { id: input.aliciId },
    select: { id: true, rol: true, aktif: true },
  });
  if (!alici || !alici.aktif) {
    return { ok: false, hata: "Alıcı bulunamadı." };
  }

  const yeni = await prisma.mesaj.create({
    data: {
      gondericiId: session.user.id,
      aliciId: alici.id,
      konu: input.konu?.trim() || null,
      icerik,
    },
    select: { id: true },
  });

  await sistemLogYaz({
    actorId: session.user.id,
    action: "mesaj_gonder",
    target: yeni.id,
    payload: { aliciId: alici.id },
  });

  const gonderen = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ad: true, soyad: true },
  });
  if (gonderen) {
    await bildirimGonder({
      kullaniciId: alici.id,
      tip: "MESAJ",
      baslik: "Yeni mesaj",
      icerik: `${gonderen.ad} ${gonderen.soyad}${input.konu ? " — " + input.konu : ""}`,
      link: `${ROL_PANELLERI[alici.rol]}/mesajlar?ile=${session.user.id}`,
    });
  }

  revalidateMesajlar();
  return { ok: true, veri: { id: yeni.id } };
}
