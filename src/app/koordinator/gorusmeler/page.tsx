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

export default async function KoordinatorGorusmeleriSayfasi() {
  const gorusmeler = await gorusmeleriListele();
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Görüşmeler</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sorumlu olduğunuz öğrencilerin koç görüşmeleri.
      </p>

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
                    {g.ogrenci.user.ad} {g.ogrenci.user.soyad}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge tonu={DURUM_TONU[g.durum]}>
                      {DURUM_ETIKETI[g.durum]}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatTr(g.tarih)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="text-xs text-slate-500">
                  Koç: {g.koc.user.ad} {g.koc.user.soyad}
                </div>
                {g.konu ? (
                  <div className="mt-2 text-sm font-medium text-slate-800">
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
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
