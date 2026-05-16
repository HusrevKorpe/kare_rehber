import Link from "next/link";
import type { BasvuruDurumu } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { telGosterim } from "@/lib/phone";
import { formatTr } from "@/lib/utils";
import { kocOnayla, kocReddet } from "@/server/basvuru-inceleme";
import { IncelemePaneli } from "../inceleme-paneli";

type SearchParams = Promise<{ durum?: string }>;

const DURUMLAR: BasvuruDurumu[] = ["BEKLEMEDE", "ONAYLANDI", "REDDEDILDI"];

const DURUM_ETIKETI: Record<BasvuruDurumu, string> = {
  BEKLEMEDE: "Bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
};

const DURUM_TONU: Record<BasvuruDurumu, "uyari" | "basari" | "hata"> = {
  BEKLEMEDE: "uyari",
  ONAYLANDI: "basari",
  REDDEDILDI: "hata",
};

export default async function KocBasvurulariSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const durum: BasvuruDurumu = (DURUMLAR as string[]).includes(sp.durum ?? "")
    ? (sp.durum as BasvuruDurumu)
    : "BEKLEMEDE";

  const basvurular = await prisma.kocOnBasvuru.findMany({
    where: { durum },
    orderBy: { olusturulma: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Koç başvuruları</h1>
        <a
          href="/api/export/basvurular?tip=koc"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          CSV indir
        </a>
      </div>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        {DURUMLAR.map((d) => (
          <Link
            key={d}
            href={`/admin/basvurular/koc?durum=${d}`}
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

      <div className="mt-6 space-y-4">
        {basvurular.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-6 text-center text-sm text-slate-500">
                Bu durumda başvuru bulunmuyor.
              </p>
            </CardBody>
          </Card>
        ) : (
          basvurular.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    {b.ad} {b.soyad}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge tonu={DURUM_TONU[b.durum]}>
                      {DURUM_ETIKETI[b.durum]}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatTr(b.olusturulma)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Satir baslik="Telefon" deger={telGosterim(b.telefon)} />
                  <Satir baslik="E-posta" deger={b.email ?? "-"} />
                  <Satir baslik="Doğum tarihi" deger={formatTr(b.dogumTarihi)} />
                  <Satir baslik="Uzmanlık" deger={b.uzmanlik ?? "-"} />
                </dl>
                {b.notlar ? (
                  <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    {b.notlar}
                  </p>
                ) : null}

                {b.durum === "BEKLEMEDE" ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <IncelemePaneli
                      basvuruId={b.id}
                      tipi="KOC"
                      onayla={kocOnayla}
                      reddet={kocReddet}
                    />
                  </div>
                ) : (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    İnceleme: {formatTr(b.incelemeTarihi)}
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

function Satir({ baslik, deger }: { baslik: string; deger: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">
        {baslik}
      </dt>
      <dd className="mt-0.5 text-slate-800">{deger}</dd>
    </div>
  );
}
