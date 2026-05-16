import { Prisma } from "@/generated/prisma/client";
import type { SmsDurumu } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { csvSerialize, csvYanit } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DURUM_DEGERLERI: SmsDurumu[] = ["GONDERILDI", "BASARISIZ", "BEKLEMEDE"];

function durumOku(v: string | null): SmsDurumu | null {
  if (!v) return null;
  return (DURUM_DEGERLERI as readonly string[]).includes(v)
    ? (v as SmsDurumu)
    : null;
}

function gunBaslangici(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function gunSonu(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: Request) {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const arama = (url.searchParams.get("arama") ?? "").trim();
  const durum = durumOku(url.searchParams.get("durum"));
  const saglayici = (url.searchParams.get("saglayici") ?? "").trim();
  const baslangic = gunBaslangici(url.searchParams.get("baslangic"));
  const bitis = gunSonu(url.searchParams.get("bitis"));

  const tarihKosul: Prisma.SmsLogWhereInput = {};
  if (baslangic || bitis) {
    tarihKosul.tarih = {
      ...(baslangic ? { gte: baslangic } : {}),
      ...(bitis ? { lte: bitis } : {}),
    };
  }

  const where: Prisma.SmsLogWhereInput = {
    AND: [
      durum ? { durum } : {},
      saglayici ? { saglayici: { equals: saglayici, mode: "insensitive" } } : {},
      arama
        ? {
            OR: [
              { aliciTel: { contains: arama } },
              { icerik: { contains: arama, mode: "insensitive" } },
            ],
          }
        : {},
      tarihKosul,
    ],
  };

  const kayitlar = await prisma.smsLog.findMany({
    where,
    orderBy: { tarih: "desc" },
    take: 5000,
  });

  const csv = csvSerialize(
    [
      "tarih",
      "alici",
      "icerik",
      "saglayici",
      "saglayici_yanit",
      "durum",
      "hata",
    ],
    kayitlar.map((k) => [
      k.tarih.toISOString(),
      k.aliciTel,
      k.icerik,
      k.saglayici,
      k.saglayiciYanit ?? "",
      k.durum,
      k.hataMesaji ?? "",
    ]),
  );

  return csvYanit(csv, `sms-log-${new Date().toISOString().slice(0, 10)}.csv`);
}
