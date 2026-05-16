import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import type { SmsDurumu } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { telGosterim } from "@/lib/phone";
import { formatTr } from "@/lib/utils";

type SearchParams = Promise<{
  arama?: string;
  durum?: string;
  saglayici?: string;
  baslangic?: string;
  bitis?: string;
}>;

const SAYFA_BOYU = 100;
const DURUM_DEGERLERI: SmsDurumu[] = ["GONDERILDI", "BASARISIZ", "BEKLEMEDE"];

function gunBaslangici(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function gunSonu(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function durumOku(v: string | undefined): SmsDurumu | null {
  if (!v) return null;
  return (DURUM_DEGERLERI as readonly string[]).includes(v)
    ? (v as SmsDurumu)
    : null;
}

export default async function SmsLogSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const arama = (sp.arama ?? "").trim();
  const durum = durumOku(sp.durum);
  const saglayici = (sp.saglayici ?? "").trim();
  const baslangic = gunBaslangici(sp.baslangic);
  const bitis = gunSonu(sp.bitis);

  const tarihKosul: Prisma.SmsLogWhereInput = {};
  if (baslangic || bitis) {
    tarihKosul.tarih = {
      ...(baslangic ? { gte: baslangic } : {}),
      ...(bitis ? { lte: bitis } : {}),
    };
  }

  const where: Prisma.SmsLogWhereInput = {
    AND: [
      durum ? { durum } : {},
      saglayici ? { saglayici: { equals: saglayici, mode: "insensitive" } } : {},
      arama
        ? {
            OR: [
              { aliciTel: { contains: arama } },
              { icerik: { contains: arama, mode: "insensitive" } },
            ],
          }
        : {},
      tarihKosul,
    ],
  };

  const [toplam, kayitlar, saglayicilar] = await Promise.all([
    prisma.smsLog.count({ where }),
    prisma.smsLog.findMany({
      where,
      orderBy: { tarih: "desc" },
      take: SAYFA_BOYU,
    }),
    prisma.smsLog.groupBy({
      by: ["saglayici"],
      _count: true,
      orderBy: { _count: { saglayici: "desc" } },
    }),
  ]);

  const exportQs = new URLSearchParams();
  if (arama) exportQs.set("arama", arama);
  if (durum) exportQs.set("durum", durum);
  if (saglayici) exportQs.set("saglayici", saglayici);
  if (sp.baslangic) exportQs.set("baslangic", sp.baslangic);
  if (sp.bitis) exportQs.set("bitis", sp.bitis);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">SMS kayıtları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gönderilen tüm SMS&apos;ler ve sağlayıcı yanıtları. Toplam {toplam}{" "}
            kayıt — en fazla {SAYFA_BOYU} satır gösterilir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/export/sms-log${exportQs.size ? `?${exportQs}` : ""}`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            CSV indir
          </Link>
          <Link
            href="/admin/audit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            ← Sistem logu
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody>
          <form className="grid gap-3 md:grid-cols-6 md:items-end">
            <div className="md:col-span-2">
              <label
                htmlFor="arama"
                className="block text-xs font-medium text-slate-600"
              >
                Arama
              </label>
              <input
                id="arama"
                name="arama"
                defaultValue={arama}
                placeholder="Telefon veya içerik"
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="durum"
                className="block text-xs font-medium text-slate-600"
              >
                Durum
              </label>
              <select
                id="durum"
                name="durum"
                defaultValue={durum ?? ""}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              >
                <option value="">Tümü</option>
                {DURUM_DEGERLERI.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="saglayici"
                className="block text-xs font-medium text-slate-600"
              >
                Sağlayıcı
              </label>
              <select
                id="saglayici"
                name="saglayici"
                defaultValue={saglayici}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              >
                <option value="">Tümü</option>
                {saglayicilar.map((s) => (
                  <option key={s.saglayici} value={s.saglayici}>
                    {s.saglayici} ({s._count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="baslangic"
                className="block text-xs font-medium text-slate-600"
              >
                Başlangıç
              </label>
              <input
                id="baslangic"
                name="baslangic"
                type="date"
                defaultValue={sp.baslangic ?? ""}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="bitis"
                className="block text-xs font-medium text-slate-600"
              >
                Bitiş
              </label>
              <input
                id="bitis"
                name="bitis"
                type="date"
                defaultValue={sp.bitis ?? ""}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="md:col-span-6 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                Filtrele
              </button>
              {(arama ||
                durum ||
                saglayici ||
                sp.baslangic ||
                sp.bitis) && (
                <Link
                  href="/admin/audit/sms"
                  className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm leading-9 text-slate-700 hover:bg-slate-50"
                >
                  Temizle
                </Link>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Alıcı</th>
              <th className="px-4 py-3">İçerik</th>
              <th className="px-4 py-3">Sağlayıcı</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kayitlar.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              kayitlar.map((k) => (
                <tr key={k.id} className="align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatTr(k.tarih)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {telGosterim(k.aliciTel)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="line-clamp-2 max-w-md">{k.icerik}</div>
                    {k.hataMesaji && (
                      <div className="mt-1 text-xs text-red-600">
                        Hata: {k.hataMesaji}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {k.saglayici}
                    {k.saglayiciYanit && (
                      <div className="text-[11px] text-slate-400">
                        {k.saglayiciYanit}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {k.durum === "GONDERILDI" ? (
                      <Badge tonu="basari">Gönderildi</Badge>
                    ) : k.durum === "BASARISIZ" ? (
                      <Badge tonu="hata">Başarısız</Badge>
                    ) : (
                      <Badge tonu="uyari">Beklemede</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
