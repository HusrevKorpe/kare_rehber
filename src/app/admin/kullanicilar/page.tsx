import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import type { Rol } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { telGosterim } from "@/lib/phone";
import { formatTr } from "@/lib/utils";
import { ROL_VALUES } from "@/lib/validation/kullanici";

type SearchParams = Promise<{ arama?: string; rol?: string }>;

const SAYFA_BOYU = 50;

function rolOkuOrNull(v: string | undefined): Rol | null {
  if (!v) return null;
  return (ROL_VALUES as readonly string[]).includes(v) ? (v as Rol) : null;
}

export default async function KullanicilarSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const arama = (sp.arama ?? "").trim();
  const rol = rolOkuOrNull(sp.rol);

  const where: Prisma.UserWhereInput = {
    AND: [
      rol ? { rol } : {},
      arama
        ? {
            OR: [
              { ad: { contains: arama, mode: "insensitive" } },
              { soyad: { contains: arama, mode: "insensitive" } },
              { telefon: { contains: arama } },
              { email: { contains: arama, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [toplam, kayitlar] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { olusturulma: "desc" },
      take: SAYFA_BOYU,
      select: {
        id: true,
        ad: true,
        soyad: true,
        telefon: true,
        email: true,
        rol: true,
        aktif: true,
        olusturulma: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Toplam {toplam} kayıt. (En fazla {SAYFA_BOYU} gösterilir.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/kullanicilar"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            CSV indir
          </a>
          <Link
            href="/admin/kullanicilar/yeni"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Yeni kullanıcı
          </Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
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
                placeholder="Ad, telefon veya e-posta"
                className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="rol"
                className="block text-xs font-medium text-slate-600"
              >
                Rol
              </label>
              <select
                id="rol"
                name="rol"
                defaultValue={rol ?? ""}
                className="mt-1 h-9 rounded-md border border-slate-300 px-3 text-sm"
              >
                <option value="">Tümü</option>
                {ROL_VALUES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_ETIKETLERI[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Filtrele
            </button>
            {(arama || rol) && (
              <Link
                href="/admin/kullanicilar"
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm leading-9 text-slate-700 hover:bg-slate-50"
              >
                Temizle
              </Link>
            )}
          </form>
        </CardBody>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ad Soyad</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kayitlar.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              kayitlar.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {k.ad} {k.soyad}
                    </div>
                    {k.email ? (
                      <div className="text-xs text-slate-500">{k.email}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {telGosterim(k.telefon)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tonu="bilgi">{ROL_ETIKETLERI[k.rol]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {k.aktif ? (
                      <Badge tonu="basari">Aktif</Badge>
                    ) : (
                      <Badge tonu="hata">Pasif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatTr(k.olusturulma)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/kullanicilar/${k.id}`}
                      className="text-sm font-medium text-slate-700 hover:underline"
                    >
                      Düzenle
                    </Link>
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
