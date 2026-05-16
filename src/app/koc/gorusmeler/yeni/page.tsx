import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { kocAktifOgrencileri } from "@/server/gorusme";
import { YeniGorusmeFormu } from "./yeni-form";

export default async function YeniGorusmeSayfasi() {
  const ogrenciler = await kocAktifOgrencileri();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Yeni görüşme</h1>
        <Link
          href="/koc/gorusmeler"
          className="text-sm text-slate-600 hover:underline"
        >
          ← Geri
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Görüşme detayları</CardTitle>
        </CardHeader>
        <CardBody>
          {ogrenciler.length === 0 ? (
            <p className="text-sm text-slate-600">
              Size atanmış aktif öğrenci yok. Lütfen admin/koordinatör ile
              iletişime geçin.
            </p>
          ) : (
            <YeniGorusmeFormu ogrenciler={ogrenciler} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
