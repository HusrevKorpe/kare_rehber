import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/server/auth";
import { kocSkoruUserId } from "@/server/koc-skoru";

export const metadata = { title: "Skorum" };

function tonu(skor: number): "basari" | "uyari" | "hata" {
  if (skor >= 75) return "basari";
  if (skor >= 50) return "uyari";
  return "hata";
}

export default async function KocSkorumSayfasi() {
  const session = await requireRole("KOC");
  const skor = await kocSkoruUserId(session.user.id);

  if (!skor) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Skorum</h1>
        <p className="mt-4 text-sm text-slate-600">
          Henüz skor bilgisi yok. Lütfen koordinatörünüzle iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Skorum</h1>

      <Card>
        <CardBody className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Genel skor</div>
            <div className="text-4xl font-semibold">{skor.skor}/100</div>
          </div>
          <Badge tonu={tonu(skor.skor)}>
            {skor.skor >= 75
              ? "Çok iyi"
              : skor.skor >= 50
                ? "Geliştirilmeli"
                : "Dikkat"}
          </Badge>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Aktif öğrenci</div>
            <div className="text-2xl font-semibold">{skor.aktifOgrenci}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Son 30 gün görüşme</div>
            <div className="text-2xl font-semibold">{skor.son30GunGorusme}</div>
            <div className="text-xs text-slate-500">
              Onaylanan: {skor.son30GunOnaylanan}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Red oranı</div>
            <div className="text-2xl font-semibold">
              %{Math.round(skor.redOrani * 100)}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Geciken eşleşme</div>
            <div className="text-2xl font-semibold">{skor.gecikenEslesme}</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nasıl hesaplanıyor?</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-slate-700">
          <p>Skor 0–100 arası, dört bileşenden oluşur (son 30 gün):</p>
          <ul className="list-disc pl-5">
            <li>
              <strong>Aktivite (%40):</strong> aktif öğrenci başına görüşme
              oranı.
            </li>
            <li>
              <strong>Onay oranı (%20):</strong> admin tarafından onaylanan
              görüşmelerin payı.
            </li>
            <li>
              <strong>Ortalama puan (%20):</strong> onaylı görüşmelerde
              verilen ilerleme puanları ortalaması.
            </li>
            <li>
              <strong>Gecikme cezası (%20):</strong> görüşme periyodu eşiğini
              aşan eşleşme sayısı.
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Ortalama ilerleme puanı:{" "}
            {skor.ortalamaPuan == null ? "—" : skor.ortalamaPuan.toFixed(1)} /
            10
          </p>
        </CardBody>
      </Card>

      <p className="text-xs text-slate-500">
        <Link href="/koc/gorusmeler/yeni" className="hover:underline">
          → Yeni görüşme oluştur
        </Link>
      </p>
    </div>
  );
}
