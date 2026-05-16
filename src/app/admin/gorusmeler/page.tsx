import Link from "next/link";
import type { GorusmeDurumu } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTr } from "@/lib/utils";
import { gorusmeleriListele } from "@/server/gorusme";
import { OnayAksiyon } from "./onay-aksiyon";

type SearchParams = Promise<{ durum?: string }>;

const DURUMLAR: GorusmeDurumu[] = [
  "GONDERILDI",
  "ONAYLANDI",
  "REDDEDILDI",
];

const DURUM_ETIKETI: Record<GorusmeDurumu, string> = {
  TASLAK: "Taslak",
  GONDERILDI: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
};

const DURUM_TONU: Record<GorusmeDurumu, "notr" | "uyari" | "basari" | "hata"> =
  {
    TASLAK: "notr",
    GONDERILDI: "uyari",
    ONAYLANDI: "basari",
    REDDEDILDI: "hata",
  };

export default async function AdminGorusmelerSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const durum: GorusmeDurumu = (DURUMLAR as string[]).includes(sp.durum ?? "")
    ? (sp.durum as GorusmeDurumu)
    : "GONDERILDI";

  const gorusmeler = await gorusmeleriListele({ durum });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Görüşmeler</h1>
          <p className="mt-1 text-sm text-slate-600">
            Koçların yazdığı görüşmeleri inceleyin ve onaylayın.
          </p>
        </div>
        <a
          href="/api/export/gorusmeler"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          CSV indir
        </a>
      </div>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        {DURUMLAR.map((d) => (
          <Link
            key={d}
            href={`/admin/gorusmeler?durum=${d}`}
            className={
              "rounded-t-md px-3 py-2 text-sm " +
              (d === durum
                ? "border-b-2 border-slate-900 font-semibold text-slate-900"
                : "text-slate-500 hover:text-slate-800")
            }
          >
            {DURUM_ETIKETI[d]}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {gorusmeler.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-6 text-center text-sm text-slate-500">
                Bu durumda görüşme yok.
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
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Koç
                </div>
                <div className="text-sm text-slate-800">
                  {g.koc.user.ad} {g.koc.user.soyad}
                </div>
                {g.konu ? (
                  <div className="mt-3 text-sm font-medium text-slate-800">
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
                {g.durum === "GONDERILDI" ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <OnayAksiyon gorusmeId={g.id} />
                  </div>
                ) : (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    İnceleme: {formatTr(g.onayTarihi)}
                  </p>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
