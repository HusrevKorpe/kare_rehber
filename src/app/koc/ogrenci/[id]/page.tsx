import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OgrenciRaporKart } from "@/components/app/ogrenci-rapor-kart";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { ogrenciRaporOku } from "@/server/ogrenci-rapor";

export const metadata = { title: "Öğrenci raporu" };

export default async function KocOgrenciRaporSayfasi(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("KOC");
  const { id } = await props.params;

  const kp = await prisma.kocProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!kp) redirect("/koc");

  const op = await prisma.ogrenciProfil.findUnique({
    where: { userId: id },
    select: { id: true },
  });
  if (!op) notFound();

  const eslesme = await prisma.ogrenciKocEslestirme.findFirst({
    where: { kocId: kp.id, ogrenciId: op.id, aktif: true },
    select: { id: true },
  });
  if (!eslesme) redirect("/koc");

  const rapor = await ogrenciRaporOku(id);
  if (!rapor) notFound();

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Öğrenci raporu</h1>
        <Link href="/koc" className="text-sm text-slate-600 hover:underline">
          ← Anasayfa
        </Link>
      </div>
      <OgrenciRaporKart rapor={rapor} />
    </div>
  );
}
