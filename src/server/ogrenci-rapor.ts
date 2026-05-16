import "server-only";
import { prisma } from "@/lib/db";

export type OgrenciRapor = {
  ogrenciProfilId: string;
  user: {
    id: string;
    ad: string;
    soyad: string;
    telefon: string;
    email: string | null;
    aktif: boolean;
  };
  il: string;
  ilce: string | null;
  sinif: string | null;
  okul: string | null;
  veli: { ad: string; soyad: string; telefon: string } | null;
  kocEslestirmeleri: Array<{
    id: string;
    baslangic: Date;
    bitis: Date | null;
    aktif: boolean;
    koc: { userId: string; ad: string; soyad: string };
  }>;
  koordinatorEslestirmeleri: Array<{
    id: string;
    baslangic: Date;
    aktif: boolean;
    koordinator: { userId: string; ad: string; soyad: string };
  }>;
  gorusmeler: Array<{
    id: string;
    tarih: Date;
    durum: "TASLAK" | "GONDERILDI" | "ONAYLANDI" | "REDDEDILDI";
    konu: string | null;
    not: string;
    ilerlemePuani: number | null;
    koc: { ad: string; soyad: string };
  }>;
  istatistik: {
    toplamGorusme: number;
    onaylanan: number;
    reddedilen: number;
    bekleyen: number;
    ortalamaPuan: number | null;
    son6PuanTrendi: { tarih: Date; puan: number }[];
  };
};

export async function ogrenciRaporOku(
  userId: string,
): Promise<OgrenciRapor | null> {
  const ogrenci = await prisma.ogrenciProfil.findUnique({
    where: { userId },
    select: {
      id: true,
      il: true,
      ilce: true,
      sinif: true,
      okul: true,
      user: {
        select: {
          id: true,
          ad: true,
          soyad: true,
          telefon: true,
          email: true,
          aktif: true,
        },
      },
      veli: {
        select: {
          user: {
            select: { ad: true, soyad: true, telefon: true },
          },
        },
      },
      kocEslestirmeleri: {
        orderBy: { baslangic: "desc" },
        select: {
          id: true,
          baslangic: true,
          bitis: true,
          aktif: true,
          koc: {
            select: {
              user: { select: { id: true, ad: true, soyad: true } },
            },
          },
        },
      },
      koordinatorEslestirmeleri: {
        orderBy: { baslangic: "desc" },
        select: {
          id: true,
          baslangic: true,
          aktif: true,
          koordinator: {
            select: {
              user: { select: { id: true, ad: true, soyad: true } },
            },
          },
        },
      },
      gorusmeler: {
        orderBy: { tarih: "desc" },
        take: 50,
        select: {
          id: true,
          tarih: true,
          durum: true,
          konu: true,
          not: true,
          ilerlemePuani: true,
          koc: {
            select: { user: { select: { ad: true, soyad: true } } },
          },
        },
      },
    },
  });

  if (!ogrenci) return null;

  const onaylanan = ogrenci.gorusmeler.filter((g) => g.durum === "ONAYLANDI");
  const reddedilen = ogrenci.gorusmeler.filter((g) => g.durum === "REDDEDILDI").length;
  const bekleyen = ogrenci.gorusmeler.filter((g) => g.durum === "GONDERILDI").length;
  const puanli = onaylanan.filter(
    (g) => typeof g.ilerlemePuani === "number",
  );
  const ortalamaPuan =
    puanli.length === 0
      ? null
      : puanli.reduce((s, g) => s + (g.ilerlemePuani ?? 0), 0) / puanli.length;

  const son6PuanTrendi = puanli
    .slice(0, 6)
    .map((g) => ({ tarih: g.tarih, puan: g.ilerlemePuani as number }))
    .reverse();

  return {
    ogrenciProfilId: ogrenci.id,
    user: ogrenci.user,
    il: ogrenci.il,
    ilce: ogrenci.ilce,
    sinif: ogrenci.sinif,
    okul: ogrenci.okul,
    veli: ogrenci.veli?.user ?? null,
    kocEslestirmeleri: ogrenci.kocEslestirmeleri.map((e) => ({
      id: e.id,
      baslangic: e.baslangic,
      bitis: e.bitis,
      aktif: e.aktif,
      koc: {
        userId: e.koc.user.id,
        ad: e.koc.user.ad,
        soyad: e.koc.user.soyad,
      },
    })),
    koordinatorEslestirmeleri: ogrenci.koordinatorEslestirmeleri.map((e) => ({
      id: e.id,
      baslangic: e.baslangic,
      aktif: e.aktif,
      koordinator: {
        userId: e.koordinator.user.id,
        ad: e.koordinator.user.ad,
        soyad: e.koordinator.user.soyad,
      },
    })),
    gorusmeler: ogrenci.gorusmeler.map((g) => ({
      id: g.id,
      tarih: g.tarih,
      durum: g.durum,
      konu: g.konu,
      not: g.not,
      ilerlemePuani: g.ilerlemePuani,
      koc: { ad: g.koc.user.ad, soyad: g.koc.user.soyad },
    })),
    istatistik: {
      toplamGorusme: ogrenci.gorusmeler.length,
      onaylanan: onaylanan.length,
      reddedilen,
      bekleyen,
      ortalamaPuan,
      son6PuanTrendi,
    },
  };
}
