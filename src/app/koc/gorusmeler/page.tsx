import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTr } from "@/lib/utils";
import { gorusmeleriListele } from "@/server/gorusme";

const DURUM_TONU = {
  TASLAK: "notr",
  GONDERILDI: "uyari",
  ONAYLANDI: "basari",
  REDDEDILDI: "hata",
} as const;

const DURUM_ETIKETI = {
  TASLAK: "Taslak",
  GONDERILDI: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
} as const;

export default async function KocGorusmeleriSayfasi() {
  const gorusmeler = await gorusmeleriListele();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Görüşmelerim</h1>
          <p className="mt-1 text-sm text-slate-600">
            Yazdığınız görüşmeler ve onay durumları.
          </p>
        </div>
        <Link
          href="/koc/gorusmeler/yeni"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Yeni görüşme
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {gorusmeler.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-6 text-center text-sm text-slate-500">
                Henüz görüşme yok.
              </p>
            </CardBody>
          </Card>
        ) : (
          gorusmeler.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    {g.ogrenci.user.ad} {g.ogrenci.user.soyad} —{" "}
                    {formatTr(g.tarih)}
                  </CardTitle>
                  <Badge tonu={DURUM_TONU[g.durum]}>
                    {DURUM_ETIKETI[g.durum]}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                {g.konu ? (
                  <div className="text-sm font-medium text-slate-800">
                    Konu: {g.konu}
                  </div>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {g.not}
                </p>
                {g.ilerlemePuani !== null ? (
                  <div className="mt-2 text-xs text-slate-500">
                    İlerleme: {g.ilerlemePuani} / 10
                  </div>
                ) : null}
                {g.durum === "REDDEDILDI" && g.redSebebi ? (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    Red sebebi: {g.redSebebi}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
