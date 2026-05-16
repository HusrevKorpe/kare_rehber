import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { tumKoclarinSkorlari } from "@/server/koc-skoru";

export const metadata = { title: "Koç skoru" };

function tonu(skor: number): "basari" | "uyari" | "hata" {
  if (skor >= 75) return "basari";
  if (skor >= 50) return "uyari";
  return "hata";
}

function rozetSinifi(t: "basari" | "uyari" | "hata") {
  if (t === "basari") return "bg-emerald-100 text-emerald-800";
  if (t === "uyari") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default async function KocSkoruSayfasi() {
  const skorlar = await tumKoclarinSkorlari();
  const ortalama =
    skorlar.length === 0
      ? 0
      : Math.round(skorlar.reduce((s, k) => s + k.skor, 0) / skorlar.length);
  const dikkat = skorlar.filter((k) => k.skor < 50).length;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Koç skoru</h1>
        <Link href="/admin/raporlar" className="text-sm text-slate-600 hover:underline">
          ← Raporlar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Aktif koç</div>
            <div className="text-2xl font-semibold">{skorlar.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Ortalama skor</div>
            <div className="text-2xl font-semibold">{ortalama}/100</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Dikkat gereken (&lt;50)</div>
            <div className="text-2xl font-semibold text-rose-700">{dikkat}</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skor tablosu</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-2">Koç</th>
                <th className="px-4 py-2">Aktif öğrenci</th>
                <th className="px-4 py-2">Son 30 gün görüşme</th>
                <th className="px-4 py-2">Onaylanan</th>
                <th className="px-4 py-2">Red oranı</th>
                <th className="px-4 py-2">Geciken</th>
                <th className="px-4 py-2">Ortalama puan</th>
                <th className="px-4 py-2">Skor</th>
              </tr>
            </thead>
            <tbody>
              {skorlar.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Aktif koç bulunmuyor.
                  </td>
                </tr>
              ) : (
                skorlar.map((k) => {
                  const t = tonu(k.skor);
                  return (
                    <tr key={k.kocId} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/kullanicilar/${k.userId}`}
                          className="font-medium hover:underline"
                        >
                          {k.ad} {k.soyad}
                        </Link>
                        <div className="text-xs text-slate-500">{k.telefon}</div>
                      </td>
                      <td className="px-4 py-2">{k.aktifOgrenci}</td>
                      <td className="px-4 py-2">{k.son30GunGorusme}</td>
                      <td className="px-4 py-2">{k.son30GunOnaylanan}</td>
                      <td className="px-4 py-2">
                        %{Math.round(k.redOrani * 100)}
                      </td>
                      <td className="px-4 py-2">
                        {k.gecikenEslesme > 0 ? (
                          <span className="font-medium text-rose-700">
                            {k.gecikenEslesme}
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {k.ortalamaPuan == null
                          ? "—"
                          : k.ortalamaPuan.toFixed(1)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={rozetSinifi(t)}>
                          {k.skor}/100
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <p className="text-xs text-slate-500">
        Skor bileşenleri: aktivite (görüşme/öğrenci oranı) %40 · onay oranı %20 ·
        ortalama ilerleme puanı %20 · gecikme cezası %20. Son 30 gün baz alınır.
      </p>
    </div>
  );
}
