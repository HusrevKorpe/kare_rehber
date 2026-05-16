import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTr } from "@/lib/utils";
import { PuanTrendGrafigi } from "./puan-trend-grafigi";
import type { OgrenciRapor } from "@/server/ogrenci-rapor";

const DURUM_TONU = {
  TASLAK: "notr",
  GONDERILDI: "uyari",
  ONAYLANDI: "basari",
  REDDEDILDI: "hata",
} as const;

const DURUM_ETIKET = {
  TASLAK: "Taslak",
  GONDERILDI: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
} as const;

export function OgrenciRaporKart({ rapor }: { rapor: OgrenciRapor }) {
  const aktifKoc = rapor.kocEslestirmeleri.find((e) => e.aktif);
  const aktifKoord = rapor.koordinatorEslestirmeleri.find((e) => e.aktif);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {rapor.user.ad} {rapor.user.soyad}
          </CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-slate-500">İletişim</div>
            <div>{rapor.user.telefon}</div>
            {rapor.user.email ? (
              <div className="text-slate-600">{rapor.user.email}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-slate-500">Konum</div>
            <div>
              {rapor.il}
              {rapor.ilce ? ` / ${rapor.ilce}` : ""}
            </div>
            {rapor.okul ? (
              <div className="text-slate-600">
                {rapor.okul}
                {rapor.sinif ? ` · ${rapor.sinif}` : ""}
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-slate-500">Aktif koç</div>
            <div>
              {aktifKoc
                ? `${aktifKoc.koc.ad} ${aktifKoc.koc.soyad}`
                : "Eşleşme yok"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Aktif koordinatör</div>
            <div>
              {aktifKoord
                ? `${aktifKoord.koordinator.ad} ${aktifKoord.koordinator.soyad}`
                : "Eşleşme yok"}
            </div>
          </div>
          {rapor.veli ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-slate-500">Veli</div>
              <div>
                {rapor.veli.ad} {rapor.veli.soyad} · {rapor.veli.telefon}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Toplam görüşme</div>
            <div className="text-2xl font-semibold">
              {rapor.istatistik.toplamGorusme}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Onaylanan</div>
            <div className="text-2xl font-semibold text-emerald-700">
              {rapor.istatistik.onaylanan}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Bekleyen</div>
            <div className="text-2xl font-semibold text-amber-700">
              {rapor.istatistik.bekleyen}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Ortalama puan</div>
            <div className="text-2xl font-semibold">
              {rapor.istatistik.ortalamaPuan == null
                ? "—"
                : rapor.istatistik.ortalamaPuan.toFixed(1)}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son 6 görüşme puan trendi</CardTitle>
        </CardHeader>
        <CardBody>
          <PuanTrendGrafigi veri={rapor.istatistik.son6PuanTrendi} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Görüşme zaman çizelgesi</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {rapor.gorusmeler.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Henüz görüşme kaydı yok.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rapor.gorusmeler.map((g) => (
                <li key={g.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">
                        {formatTr(g.tarih)}
                        {g.konu ? (
                          <span className="ml-2 text-slate-600">· {g.konu}</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        {g.koc.ad} {g.koc.soyad}
                        {typeof g.ilerlemePuani === "number"
                          ? ` · Puan: ${g.ilerlemePuani}/10`
                          : ""}
                      </div>
                      {g.durum === "ONAYLANDI" ? (
                        <p className="mt-1 text-sm text-slate-700 line-clamp-3">
                          {g.not}
                        </p>
                      ) : null}
                    </div>
                    <Badge tonu={DURUM_TONU[g.durum]}>
                      {DURUM_ETIKET[g.durum]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eşleşme geçmişi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Koç
            </div>
            {rapor.kocEslestirmeleri.length === 0 ? (
              <div className="text-slate-500">Kayıt yok.</div>
            ) : (
              <ul className="mt-1 space-y-1">
                {rapor.kocEslestirmeleri.map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <span>
                      {e.koc.ad} {e.koc.soyad}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTr(e.baslangic)}
                      {e.bitis ? ` → ${formatTr(e.bitis)}` : ""}
                    </span>
                    {e.aktif ? <Badge tonu="basari">Aktif</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Koordinatör
            </div>
            {rapor.koordinatorEslestirmeleri.length === 0 ? (
              <div className="text-slate-500">Kayıt yok.</div>
            ) : (
              <ul className="mt-1 space-y-1">
                {rapor.koordinatorEslestirmeleri.map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <span>
                      {e.koordinator.ad} {e.koordinator.soyad}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTr(e.baslangic)}
                    </span>
                    {e.aktif ? <Badge tonu="basari">Aktif</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
