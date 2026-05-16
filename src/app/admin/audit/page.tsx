import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { formatTr } from "@/lib/utils";

type SearchParams = Promise<{
  arama?: string;
  action?: string;
  baslangic?: string;
  bitis?: string;
}>;

const SAYFA_BOYU = 100;

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

export default async function AuditSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const arama = (sp.arama ?? "").trim();
  const action = (sp.action ?? "").trim();
  const baslangic = gunBaslangici(sp.baslangic);
  const bitis = gunSonu(sp.bitis);

  const tarihKosul: Prisma.SistemLogWhereInput = {};
  if (baslangic || bitis) {
    tarihKosul.tarih = {
      ...(baslangic ? { gte: baslangic } : {}),
      ...(bitis ? { lte: bitis } : {}),
    };
  }

  const where: Prisma.SistemLogWhereInput = {
    AND: [
      action ? { action: { contains: action, mode: "insensitive" } } : {},
      arama
        ? {
            OR: [
              { target: { contains: arama, mode: "insensitive" } },
              { actor: { ad: { contains: arama, mode: "insensitive" } } },
              { actor: { soyad: { contains: arama, mode: "insensitive" } } },
              { actor: { telefon: { contains: arama } } },
            ],
          }
        : {},
      tarihKosul,
    ],
  };

  const [toplam, kayitlar, mevcutAksiyonlar] = await Promise.all([
    prisma.sistemLog.count({ where }),
    prisma.sistemLog.findMany({
      where,
      orderBy: { tarih: "desc" },
      take: SAYFA_BOYU,
      include: {
        actor: { select: { ad: true, soyad: true, rol: true } },
      },
    }),
    prisma.sistemLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 15,
    }),
  ]);

  const exportQs = new URLSearchParams();
  if (arama) exportQs.set("arama", arama);
  if (action) exportQs.set("action", action);
  if (sp.baslangic) exportQs.set("baslangic", sp.baslangic);
  if (sp.bitis) exportQs.set("bitis", sp.bitis);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Denetim kayıtları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sistem üzerindeki tüm önemli aksiyonlar burada listelenir. Toplam{" "}
            {toplam} kayıt — en fazla {SAYFA_BOYU} satır gösterilir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/export/sistem-log${exportQs.size ? `?${exportQs}` : ""}`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            CSV indir
          </Link>
          <Link
            href="/admin/audit/sms"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            SMS kayıtları →
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody>
          <form className="grid gap-3 md:grid-cols-5 md:items-end">
            <div className="md:col-span-2">
              <label
                htmlFor="arama"
                className="block text-xs font-medium text-slate-600"
              >
                Arama (hedef veya aktör)
              </label>
              <input
                id="arama"
                name="arama"
                defaultValue={arama}
                placeholder="Ad, telefon veya hedef id"
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="action"
                className="block text-xs font-medium text-slate-600"
              >
                Aksiyon
              </label>
              <input
                id="action"
                name="action"
                defaultValue={action}
                placeholder="Örn. kullanici.olustur"
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
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
            <div className="md:col-span-5 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                Filtrele
              </button>
              {(arama || action || sp.baslangic || sp.bitis) && (
                <Link
                  href="/admin/audit"
                  className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm leading-9 text-slate-700 hover:bg-slate-50"
                >
                  Temizle
                </Link>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {mevcutAksiyonlar.length > 0 && (
        <Card className="mt-4">
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Sık görülen aksiyonlar
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {mevcutAksiyonlar.map((a) => (
                <Link
                  key={a.action}
                  href={`/admin/audit?action=${encodeURIComponent(a.action)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  {a.action}{" "}
                  <span className="ml-1 text-slate-400">({a._count})</span>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Aktör</th>
              <th className="px-4 py-3">Aksiyon</th>
              <th className="px-4 py-3">Hedef</th>
              <th className="px-4 py-3">Detay</th>
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
                  <td className="px-4 py-3">
                    {k.actor ? (
                      <div>
                        <div className="font-medium text-slate-900">
                          {k.actor.ad} {k.actor.soyad}
                        </div>
                        <div className="text-xs">
                          <Badge tonu="bilgi">
                            {ROL_ETIKETLERI[k.actor.rol]}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">sistem</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      {k.action}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {k.target ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {k.payload ? (
                      <details>
                        <summary className="cursor-pointer text-slate-600">
                          Göster
                        </summary>
                        <pre className="mt-2 max-w-md whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[11px] text-slate-700">
                          {JSON.stringify(k.payload, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      "-"
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
