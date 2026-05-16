import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatTr } from "@/lib/utils";
import { gorusmePeriyotGun } from "@/server/ayar";

export default async function RaporlarSayfasi() {
  const sonGun = 30;
  const simdi = new Date();
  const son30 = new Date(simdi.getTime() - sonGun * 24 * 60 * 60 * 1000);
  const periyot = await gorusmePeriyotGun();
  const periyotEsik = new Date(simdi.getTime() - periyot * 24 * 60 * 60 * 1000);

  const [
    aktifOgrenci,
    aktifKoc,
    aktifKoord,
    bekleyenGorusme,
    onaylananSon30,
    reddedilenSon30,
    eslesmesizOgrenciler,
    aktifEslesmeler,
  ] = await Promise.all([
    prisma.user.count({ where: { rol: "OGRENCI", aktif: true } }),
    prisma.user.count({ where: { rol: "KOC", aktif: true } }),
    prisma.user.count({ where: { rol: "KOORDINATOR", aktif: true } }),
    prisma.gorusme.count({ where: { durum: "GONDERILDI" } }),
    prisma.gorusme.count({
      where: { durum: "ONAYLANDI", olusturulma: { gte: son30 } },
    }),
    prisma.gorusme.count({
      where: { durum: "REDDEDILDI", olusturulma: { gte: son30 } },
    }),
    prisma.ogrenciProfil.findMany({
      where: {
        user: { aktif: true },
        kocEslestirmeleri: { none: { aktif: true } },
      },
      select: {
        id: true,
        il: true,
        user: {
          select: { id: true, ad: true, soyad: true },
        },
      },
      take: 50,
    }),
    prisma.ogrenciKocEslestirme.findMany({
      where: { aktif: true },
      select: {
        id: true,
        baslangic: true,
        ogrenci: {
          select: {
            id: true,
            user: { select: { id: true, ad: true, soyad: true } },
          },
        },
        koc: {
          select: {
            user: { select: { ad: true, soyad: true } },
          },
        },
      },
    }),
  ]);

  // Geciken: aktif eşleşmesi olan ama son [periyot] gün içinde
  // ONAYLANDI durumda görüşmesi olmayanlar.
  const ogrenciIds = aktifEslesmeler.map((e) => e.ogrenci.id);
  const sonGorusmeler =
    ogrenciIds.length === 0
      ? []
      : await prisma.gorusme.groupBy({
          by: ["ogrenciId"],
          where: {
            ogrenciId: { in: ogrenciIds },
            durum: "ONAYLANDI",
          },
          _max: { tarih: true },
        });
  const sonGorusmeMap = new Map(
    sonGorusmeler.map((s) => [s.ogrenciId, s._max.tarih ?? null]),
  );
  const gecikenler = aktifEslesmeler
    .map((e) => {
      const son = sonGorusmeMap.get(e.ogrenci.id) ?? null;
      return { eslesme: e, sonGorusme: son };
    })
    .filter((x) => !x.sonGorusme || x.sonGorusme < periyotEsik)
    .sort((a, b) => {
      const av = a.sonGorusme?.getTime() ?? 0;
      const bv = b.sonGorusme?.getTime() ?? 0;
      return av - bv;
    });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Raporlar</h1>
        <Link
          href="/admin/raporlar/koc-skoru"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Koç skoru →
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Genel durum ve aksiyon gerektiren öğeler.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Sayim baslik="Aktif öğrenci" deger={aktifOgrenci} />
        <Sayim baslik="Aktif koç" deger={aktifKoc} />
        <Sayim baslik="Aktif koordinatör" deger={aktifKoord} />
        <Sayim baslik="Onay bekleyen görüşme" deger={bekleyenGorusme} />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son 30 gün — Onaylanan görüşme
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {onaylananSon30}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son 30 gün — Reddedilen görüşme
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {reddedilenSon30}
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Geciken görüşmeler</CardTitle>
              <Badge tonu={gecikenler.length > 0 ? "uyari" : "basari"}>
                {gecikenler.length}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <p className="px-5 py-3 text-xs text-slate-500">
              Aktif koç eşleşmesi olan ama son {periyot} günde onaylanmış
              görüşmesi olmayan öğrenciler.
            </p>
            {gecikenler.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">
                Geciken görüşme yok. 🎯
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {gecikenler.slice(0, 25).map((g) => (
                  <li
                    key={g.eslesme.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div>
                      <Link
                        href={`/admin/raporlar/ogrenci/${g.eslesme.ogrenci.user.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {g.eslesme.ogrenci.user.ad} {g.eslesme.ogrenci.user.soyad}
                      </Link>
                      <div className="text-xs text-slate-500">
                        Koç: {g.eslesme.koc.user.ad}{" "}
                        {g.eslesme.koc.user.soyad}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {g.sonGorusme
                        ? `Son: ${formatTr(g.sonGorusme)}`
                        : "Henüz görüşme yok"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Eşleştirme bekleyen öğrenciler</CardTitle>
              <Badge tonu={eslesmesizOgrenciler.length > 0 ? "uyari" : "basari"}>
                {eslesmesizOgrenciler.length}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <p className="px-5 py-3 text-xs text-slate-500">
              Aktif olmasına rağmen henüz koç ataması yapılmamış öğrenciler.
            </p>
            {eslesmesizOgrenciler.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">
                Tüm aktif öğrencilerin koçu var.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {eslesmesizOgrenciler.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {o.user.ad} {o.user.soyad}
                      </div>
                      <div className="text-xs text-slate-500">
                        {o.il ?? "-"}
                      </div>
                    </div>
                    <Link
                      href="/admin/eslestirme"
                      className="text-xs font-medium text-slate-700 hover:underline"
                    >
                      Atama yap →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function Sayim({ baslik, deger }: { baslik: string; deger: number }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {baslik}
        </div>
        <div className="mt-1 text-3xl font-semibold">{deger}</div>
      </CardBody>
    </Card>
  );
}
