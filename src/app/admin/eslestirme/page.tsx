import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { telGosterim } from "@/lib/phone";
import { formatTr } from "@/lib/utils";
import { EslestirmeSatirAksiyon } from "./eslestirme-aksiyon";

export default async function EslestirmePage() {
  const [ogrenciler, koclar, koordinatorler] = await Promise.all([
    prisma.user.findMany({
      where: { rol: "OGRENCI", aktif: true },
      orderBy: { ad: "asc" },
      select: {
        id: true,
        ad: true,
        soyad: true,
        telefon: true,
        ogrenciProfil: {
          select: {
            id: true,
            il: true,
            sinif: true,
            kocEslestirmeleri: {
              where: { aktif: true },
              select: {
                id: true,
                baslangic: true,
                koc: {
                  select: {
                    id: true,
                    user: { select: { id: true, ad: true, soyad: true } },
                  },
                },
              },
              take: 1,
            },
            koordinatorEslestirmeleri: {
              where: { aktif: true },
              select: {
                id: true,
                baslangic: true,
                koordinator: {
                  select: {
                    id: true,
                    vakifAdi: true,
                    user: { select: { id: true, ad: true, soyad: true } },
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { rol: "KOC", aktif: true, kocProfil: { durum: { not: "PASIF" } } },
      orderBy: [{ ad: "asc" }],
      select: {
        id: true,
        ad: true,
        soyad: true,
        kocProfil: { select: { durum: true, uzmanlik: true } },
      },
    }),
    prisma.user.findMany({
      where: { rol: "KOORDINATOR", aktif: true },
      orderBy: [{ ad: "asc" }],
      select: {
        id: true,
        ad: true,
        soyad: true,
        koordinatorProfil: { select: { vakifAdi: true, il: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Eşleştirme</h1>
      <p className="mt-1 text-sm text-slate-600">
        Aktif öğrencilere koç ve vakıf koordinatörü ataması yapın. Yeni atama,
        mevcut eşleştirmeyi otomatik kapatır.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Aktif öğrenci
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {ogrenciler.length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Atanabilir koç
            </div>
            <div className="mt-1 text-2xl font-semibold">{koclar.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Koordinatör
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {koordinatorler.length}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Öğrenciler</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Öğrenci</th>
                <th className="px-4 py-3">Aktif Koç</th>
                <th className="px-4 py-3">Aktif Koordinatör</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ogrenciler.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aktif öğrenci yok.
                  </td>
                </tr>
              ) : (
                ogrenciler.map((o) => {
                  const profil = o.ogrenciProfil;
                  const kocEs = profil?.kocEslestirmeleri[0];
                  const koordEs = profil?.koordinatorEslestirmeleri[0];
                  return (
                    <tr key={o.id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {o.ad} {o.soyad}
                        </div>
                        <div className="text-xs text-slate-500">
                          {telGosterim(o.telefon)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {profil?.il ?? "-"}
                          {profil?.sinif ? ` • ${profil.sinif}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {kocEs ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {kocEs.koc.user.ad} {kocEs.koc.user.soyad}
                            </div>
                            <div className="text-xs text-slate-500">
                              Başlangıç: {formatTr(kocEs.baslangic)}
                            </div>
                          </div>
                        ) : (
                          <Badge tonu="uyari">Koç atanmamış</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {koordEs ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {koordEs.koordinator.user.ad}{" "}
                              {koordEs.koordinator.user.soyad}
                            </div>
                            <div className="text-xs text-slate-500">
                              {koordEs.koordinator.vakifAdi}
                            </div>
                          </div>
                        ) : (
                          <Badge tonu="uyari">Koordinatör atanmamış</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <EslestirmeSatirAksiyon
                          ogrenciUserId={o.id}
                          ogrenciAdSoyad={`${o.ad} ${o.soyad}`}
                          kocEslestirmeId={kocEs?.id ?? null}
                          koordEslestirmeId={koordEs?.id ?? null}
                          koclar={koclar.map((k) => ({
                            id: k.id,
                            adSoyad: `${k.ad} ${k.soyad}`,
                            uzmanlik: k.kocProfil?.uzmanlik ?? null,
                            durum: k.kocProfil?.durum ?? "HAVUZ",
                          }))}
                          koordinatorler={koordinatorler.map((k) => ({
                            id: k.id,
                            adSoyad: `${k.ad} ${k.soyad}`,
                            vakifAdi: k.koordinatorProfil?.vakifAdi ?? "",
                          }))}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
