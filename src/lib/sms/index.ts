import { prisma } from "@/lib/db";
import { mockSmsSaglayici } from "./mock";
import { netgsmSaglayici } from "./netgsm";
import { iletimerkeziSaglayici } from "./iletimerkezi";
import type { SmsSaglayici } from "./types";

function aktifSaglayici(): SmsSaglayici {
  const adi = (process.env.SMS_PROVIDER ?? "mock").toLowerCase();
  switch (adi) {
    case "mock":
      return mockSmsSaglayici;
    case "netgsm":
      return netgsmSaglayici;
    case "iletimerkezi":
      return iletimerkeziSaglayici;
    default:
      return mockSmsSaglayici;
  }
}

export async function smsGonder(opts: {
  aliciTel: string;
  icerik: string;
  aliciUserId?: string;
  gonderenId?: string;
}) {
  const saglayici = aktifSaglayici();
  const sonuc = await saglayici.gonder({
    aliciTel: opts.aliciTel,
    icerik: opts.icerik,
  });

  await prisma.smsLog.create({
    data: {
      aliciTel: opts.aliciTel,
      aliciUserId: opts.aliciUserId,
      icerik: opts.icerik,
      saglayici: saglayici.ad,
      saglayiciYanit: sonuc.saglayiciYanit,
      hataMesaji: sonuc.hata,
      durum: sonuc.basarili ? "GONDERILDI" : "BASARISIZ",
      gonderenId: opts.gonderenId,
    },
  });

  return sonuc;
}

export async function smsCoklu(
  alicilar: { tel: string; userId?: string }[],
  icerik: string,
  gonderenId?: string,
) {
  const sonuclar = await Promise.all(
    alicilar.map((a) =>
      smsGonder({
        aliciTel: a.tel,
        icerik,
        aliciUserId: a.userId,
        gonderenId,
      }),
    ),
  );
  return sonuclar;
}
