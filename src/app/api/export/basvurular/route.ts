import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { csvSerialize, csvYanit } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireRole("ADMIN");
  const tip = req.nextUrl.searchParams.get("tip");

  if (tip === "koc") {
    const koclar = await prisma.kocOnBasvuru.findMany({
      orderBy: { olusturulma: "desc" },
    });
    const csv = csvSerialize(
      [
        "id",
        "ad",
        "soyad",
        "telefon",
        "email",
        "uzmanlik",
        "durum",
        "olusturulma",
      ],
      koclar.map((k) => [
        k.id,
        k.ad,
        k.soyad,
        k.telefon,
        k.email ?? "",
        k.uzmanlik ?? "",
        k.durum,
        k.olusturulma,
      ]),
    );
    return csvYanit(csv, `koc-basvurulari-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // Varsayılan: öğrenci başvuruları
  const ogrenciler = await prisma.ogrenciKayitBasvuru.findMany({
    orderBy: { olusturulma: "desc" },
  });
  const csv = csvSerialize(
    [
      "id",
      "ad",
      "soyad",
      "telefon",
      "il",
      "ilce",
      "sinif",
      "okul",
      "veliAd",
      "veliSoyad",
      "veliTelefon",
      "durum",
      "olusturulma",
    ],
    ogrenciler.map((b) => [
      b.id,
      b.ad,
      b.soyad,
      b.telefon,
      b.il,
      b.ilce ?? "",
      b.sinif ?? "",
      b.okul ?? "",
      b.veliAd ?? "",
      b.veliSoyad ?? "",
      b.veliTelefon ?? "",
      b.durum,
      b.olusturulma,
    ]),
  );
  return csvYanit(
    csv,
    `ogrenci-basvurulari-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
