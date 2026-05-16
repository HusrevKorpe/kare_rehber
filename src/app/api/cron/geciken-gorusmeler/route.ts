import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AYAR_ANAHTARLARI, AYAR_VARSAYILANLARI } from "@/lib/ayar-anahtarlar";
import { bildirimGonder } from "@/server/bildirim";
import { smsGonder } from "@/lib/sms";
import { sistemLogYaz } from "@/server/log";
import { cronYetkili } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function periyotGunOku(): Promise<number> {
  const k = await prisma.ayar.findUnique({
    where: { anahtar: AYAR_ANAHTARLARI.gorusmePeriyotGun },
    select: { deger: true },
  });
  const v = k?.deger ?? AYAR_VARSAYILANLARI[AYAR_ANAHTARLARI.gorusmePeriyotGun];
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 14;
}

export async function GET(req: NextRequest) {
  if (!cronYetkili(req)) {
    return NextResponse.json({ ok: false, hata: "Yetkisiz" }, { status: 401 });
  }

  const periyotGun = await periyotGunOku();
  const esik = new Date(Date.now() - periyotGun * 24 * 60 * 60 * 1000);

  const aktifEslesmeler = await prisma.ogrenciKocEslestirme.findMany({
    where: { aktif: true },
    select: {
      ogrenciId: true,
      kocId: true,
      koc: {
        select: {
          user: { select: { id: true, ad: true, soyad: true, telefon: true } },
        },
      },
      ogrenci: {
        select: {
          user: { select: { id: true, ad: true, soyad: true } },
        },
      },
    },
  });

  let uyariSayisi = 0;
  const uyariDetay: Array<{ kocId: string; ogrenciId: string }> = [];

  for (const e of aktifEslesmeler) {
    const sonGorusme = await prisma.gorusme.findFirst({
      where: {
        kocId: e.kocId,
        ogrenciId: e.ogrenciId,
        durum: "ONAYLANDI",
      },
      orderBy: { tarih: "desc" },
      select: { tarih: true },
    });
    const gecikmis = !sonGorusme || sonGorusme.tarih < esik;
    if (!gecikmis) continue;

    const ogrAdSoyad = `${e.ogrenci.user.ad} ${e.ogrenci.user.soyad}`;
    await bildirimGonder({
      kullaniciId: e.koc.user.id,
      tip: "GECIKEN_GORUSME",
      baslik: "Geciken görüşme",
      icerik: `${ogrAdSoyad} için son ${periyotGun} gündür onaylı görüşme kaydı yok.`,
      link: "/koc/gorusmeler",
    });
    if (e.koc.user.telefon) {
      await smsGonder({
        aliciTel: e.koc.user.telefon,
        aliciUserId: e.koc.user.id,
        icerik: `KARE-Rehber: ${ogrAdSoyad} için ${periyotGun} günden uzun süredir görüşme kaydı yok. Lütfen güncel görüşmenizi sisteme girin.`,
      });
    }
    uyariSayisi++;
    uyariDetay.push({ kocId: e.kocId, ogrenciId: e.ogrenciId });
  }

  await sistemLogYaz({
    action: "cron_geciken_gorusmeler",
    payload: { periyotGun, uyariSayisi, esik: esik.toISOString() },
  });

  return NextResponse.json({
    ok: true,
    periyotGun,
    uyariSayisi,
    detay: uyariDetay,
  });
}
