import Link from "next/link";
import { notFound } from "next/navigation";
import { OgrenciRaporKart } from "@/components/app/ogrenci-rapor-kart";
import { ogrenciRaporOku } from "@/server/ogrenci-rapor";

export const metadata = { title: "Öğrenci raporu" };

export default async function AdminOgrenciRaporSayfasi(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const rapor = await ogrenciRaporOku(id);
  if (!rapor) notFound();

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Öğrenci raporu</h1>
        <Link href="/admin/raporlar" className="text-sm text-slate-600 hover:underline">
          ← Raporlar
        </Link>
      </div>
      <OgrenciRaporKart rapor={rapor} />
    </div>
  );
}
