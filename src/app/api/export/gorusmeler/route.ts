import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { csvSerialize, csvYanit } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireRole("ADMIN");
  const gorusmeler = await prisma.gorusme.findMany({
    orderBy: { tarih: "desc" },
    include: {
      koc: { include: { user: { select: { ad: true, soyad: true } } } },
      ogrenci: {
        include: { user: { select: { ad: true, soyad: true } } },
      },
    },
  });

  const csv = csvSerialize(
    [
      "id",
      "tarih",
      "ogrenci",
      "koc",
      "durum",
      "konu",
      "ilerlemePuani",
      "olusturulma",
    ],
    gorusmeler.map((g) => [
      g.id,
      g.tarih,
      `${g.ogrenci.user.ad} ${g.ogrenci.user.soyad}`,
      `${g.koc.user.ad} ${g.koc.user.soyad}`,
      g.durum,
      g.konu ?? "",
      g.ilerlemePuani ?? "",
      g.olusturulma,
    ]),
  );

  return csvYanit(csv, `gorusmeler-${new Date().toISOString().slice(0, 10)}.csv`);
}
