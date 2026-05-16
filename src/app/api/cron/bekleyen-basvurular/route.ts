import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rolBazliBildirim } from "@/server/bildirim";
import { smsGonder } from "@/lib/sms";
import { sistemLogYaz } from "@/server/log";
import { cronYetkili } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!cronYetkili(req)) {
    return NextResponse.json({ ok: false, hata: "Yetkisiz" }, { status: 401 });
  }

  const [ogrenciSayi, kocSayi] = await Promise.all([
    prisma.ogrenciKayitBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
    prisma.kocOnBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
  ]);

  const toplam = ogrenciSayi + kocSayi;
  if (toplam === 0) {
    await sistemLogYaz({
      action: "cron_bekleyen_basvurular",
      payload: { ogrenciSayi, kocSayi },
    });
    return NextResponse.json({ ok: true, ogrenciSayi, kocSayi, smsGonderildi: 0 });
  }

  const ozet = `${ogrenciSayi} öğrenci, ${kocSayi} koç başvurusu inceleme bekliyor.`;
  await rolBazliBildirim(["ADMIN"], {
    tip: "SISTEM",
    baslik: "Bekleyen başvurular",
    icerik: ozet,
    link: "/admin/basvurular/ogrenci",
  });

  const adminler = await prisma.user.findMany({
    where: { rol: "ADMIN", aktif: true, telefon: { not: "" } },
    select: { id: true, telefon: true },
  });
  for (const a of adminler) {
    await smsGonder({
      aliciTel: a.telefon,
      aliciUserId: a.id,
      icerik: `KARE-Rehber: ${ozet}`,
    });
  }

  await sistemLogYaz({
    action: "cron_bekleyen_basvurular",
    payload: { ogrenciSayi, kocSayi, smsGonderildi: adminler.length },
  });

  return NextResponse.json({
    ok: true,
    ogrenciSayi,
    kocSayi,
    smsGonderildi: adminler.length,
  });
}
