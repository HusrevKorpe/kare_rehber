import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTr } from "@/lib/utils";
import { gorusmeleriListele } from "@/server/gorusme";

export default async function OgrenciGorusmelerimSayfasi() {
  const gorusmeler = await gorusmeleriListele();
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Görüşmelerim</h1>
      <p className="mt-1 text-sm text-slate-600">
        Koçunuzla yapılan ve admin tarafından onaylanmış görüşmeler.
      </p>

      <div className="mt-6 space-y-3">
        {gorusmeler.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-6 text-center text-sm text-slate-500">
                Henüz onaylanmış görüşme yok.
              </p>
            </CardBody>
          </Card>
        ) : (
          gorusmeler.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{formatTr(g.tarih)}</CardTitle>
                  <span className="text-xs text-slate-500">
                    Koç: {g.koc.user.ad} {g.koc.user.soyad}
                  </span>
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
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
