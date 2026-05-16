import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { csvSerialize, csvYanit } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const action = (url.searchParams.get("action") ?? "").trim();
  const baslangic = gunBaslangici(url.searchParams.get("baslangic"));
  const bitis = gunSonu(url.searchParams.get("bitis"));

  const tarihKosul: Prisma.SistemLogWhereInput = {};
  if (baslangic || bitis) {
    tarihKosul.tarih = {
      ...(baslangic ? { gte: baslangic } : {}),
      ...(bitis ? { lte: bitis } : {}),
    };
  }

  const where: Prisma.SistemLogWhereInput = {
    AND: [
      action ? { action: { contains: action, mode: "insensitive" } } : {},
      arama
        ? {
            OR: [
              { target: { contains: arama, mode: "insensitive" } },
              { actor: { ad: { contains: arama, mode: "insensitive" } } },
              { actor: { soyad: { contains: arama, mode: "insensitive" } } },
              { actor: { telefon: { contains: arama } } },
            ],
          }
        : {},
      tarihKosul,
    ],
  };

  const kayitlar = await prisma.sistemLog.findMany({
    where,
    orderBy: { tarih: "desc" },
    take: 5000,
    include: { actor: { select: { ad: true, soyad: true, rol: true } } },
  });

  const csv = csvSerialize(
    ["tarih", "aktor", "aktor_rol", "action", "target", "ip", "payload"],
    kayitlar.map((k) => [
      k.tarih.toISOString(),
      k.actor ? `${k.actor.ad} ${k.actor.soyad}` : "",
      k.actor?.rol ?? "",
      k.action,
      k.target ?? "",
      k.ip ?? "",
      k.payload ?? "",
    ]),
  );

  return csvYanit(csv, `sistem-log-${new Date().toISOString().slice(0, 10)}.csv`);
}
