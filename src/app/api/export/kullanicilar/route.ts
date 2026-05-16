import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { csvSerialize, csvYanit } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireRole("ADMIN");
  const kullanicilar = await prisma.user.findMany({
    orderBy: [{ rol: "asc" }, { ad: "asc" }],
    select: {
      id: true,
      ad: true,
      soyad: true,
      telefon: true,
      email: true,
      rol: true,
      aktif: true,
      olusturulma: true,
    },
  });

  const csv = csvSerialize(
    ["id", "ad", "soyad", "telefon", "email", "rol", "aktif", "olusturulma"],
    kullanicilar.map((u) => [
      u.id,
      u.ad,
      u.soyad,
      u.telefon,
      u.email,
      u.rol,
      u.aktif ? "evet" : "hayır",
      u.olusturulma,
    ]),
  );

  return csvYanit(csv, `kullanicilar-${new Date().toISOString().slice(0, 10)}.csv`);
}
