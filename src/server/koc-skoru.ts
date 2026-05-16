import "server-only";
import { prisma } from "@/lib/db";
import { AYAR_ANAHTARLARI, AYAR_VARSAYILANLARI } from "@/lib/ayar-anahtarlar";

export type KocSkoru = {
  kocId: string;
  userId: string;
  ad: string;
  soyad: string;
  email: string | null;
  telefon: string;
  aktifOgrenci: number;
  son30GunGorusme: number;
  son30GunOnaylanan: number;
  gecikenEslesme: number;
  redOrani: number; // 0–1
  ortalamaPuan: number | null; // onaylanan görüşmeler üzerinden, 0–10
  skor: number; // 0–100
};

type Detay = {
  kocId: string;
  aktifOgrenci: number;
  toplamGorusme: number;
  onaylanan: number;
  reddedilen: number;
  ortalamaPuan: number | null;
  gecikenEslesme: number;
};

async function periyotGunOku(): Promise<number> {
  const k = await prisma.ayar.findUnique({
    where: { anahtar: AYAR_ANAHTARLARI.gorusmePeriyotGun },
    select: { deger: true },
  });
  const v = k?.deger ?? AYAR_VARSAYILANLARI[AYAR_ANAHTARLARI.gorusmePeriyotGun];
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 14;
}

function skorHesapla(d: Detay): number {
  // Görüşme aktivitesi (40 puan): ideal hedef koç başına ortalama 1 görüşme/öğrenci/ay.
  const hedef = Math.max(1, d.aktifOgrenci);
  const aktiviteOran = Math.min(1, d.toplamGorusme / hedef);
  const aktivitePuan = aktiviteOran * 40;

  // Onay oranı (20 puan).
  const incelenmis = d.onaylanan + d.reddedilen;
  const onayOran = incelenmis === 0 ? 1 : d.onaylanan / incelenmis;
  const onayPuan = onayOran * 20;

  // Ortalama ilerleme puanı (20 puan).
  const puanOran = d.ortalamaPuan == null ? 0.6 : d.ortalamaPuan / 10;
  const puanPuan = puanOran * 20;

  // Gecikme cezası (20 puan başlangıç, geciken her eşleşme 5 puan götürür).
  const gecikmePuan = Math.max(0, 20 - d.gecikenEslesme * 5);

  return Math.round(aktivitePuan + onayPuan + puanPuan + gecikmePuan);
}

export async function tumKoclarinSkorlari(): Promise<KocSkoru[]> {
  const periyotGun = await periyotGunOku();
  const otuzGunOnce = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const gecikmeEsigi = new Date(Date.now() - periyotGun * 24 * 60 * 60 * 1000);

  const koclar = await prisma.kocProfil.findMany({
    where: { user: { aktif: true } },
    select: {
      id: true,
      durum: true,
      user: {
        select: { id: true, ad: true, soyad: true, email: true, telefon: true },
      },
    },
  });

  const sonuc: KocSkoru[] = [];

  for (const k of koclar) {
    const aktifEslesmeler = await prisma.ogrenciKocEslestirme.findMany({
      where: { kocId: k.id, aktif: true },
      select: {
        ogrenciId: true,
        ogrenci: {
          select: {
            gorusmeler: {
              where: { durum: "ONAYLANDI" },
              orderBy: { tarih: "desc" },
              take: 1,
              select: { tarih: true },
            },
          },
        },
      },
    });

    const aktifOgrenci = aktifEslesmeler.length;
    const geciken = aktifEslesmeler.filter((e) => {
      const son = e.ogrenci.gorusmeler[0]?.tarih;
      if (!son) return true;
      return son < gecikmeEsigi;
    }).length;

    const son30 = await prisma.gorusme.findMany({
      where: { kocId: k.id, tarih: { gte: otuzGunOnce } },
      select: { durum: true, ilerlemePuani: true },
    });

    const onaylanan = son30.filter((g) => g.durum === "ONAYLANDI").length;
    const reddedilen = son30.filter((g) => g.durum === "REDDEDILDI").length;
    const puanli = son30.filter(
      (g) => g.durum === "ONAYLANDI" && typeof g.ilerlemePuani === "number",
    );
    const ortalamaPuan =
      puanli.length > 0
        ? puanli.reduce((s, g) => s + (g.ilerlemePuani ?? 0), 0) / puanli.length
        : null;

    const incelenmis = onaylanan + reddedilen;
    const redOrani = incelenmis === 0 ? 0 : reddedilen / incelenmis;

    const skor = skorHesapla({
      kocId: k.id,
      aktifOgrenci,
      toplamGorusme: son30.length,
      onaylanan,
      reddedilen,
      ortalamaPuan,
      gecikenEslesme: geciken,
    });

    sonuc.push({
      kocId: k.id,
      userId: k.user.id,
      ad: k.user.ad,
      soyad: k.user.soyad,
      email: k.user.email,
      telefon: k.user.telefon,
      aktifOgrenci,
      son30GunGorusme: son30.length,
      son30GunOnaylanan: onaylanan,
      gecikenEslesme: geciken,
      redOrani,
      ortalamaPuan,
      skor,
    });
  }

  sonuc.sort((a, b) => b.skor - a.skor);
  return sonuc;
}

export async function kocSkoruUserId(userId: string): Promise<KocSkoru | null> {
  const koc = await prisma.kocProfil.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!koc) return null;
  const hepsi = await tumKoclarinSkorlari();
  return hepsi.find((k) => k.kocId === koc.id) ?? null;
}
