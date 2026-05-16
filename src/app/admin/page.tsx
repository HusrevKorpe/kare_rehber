import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { AYAR_ANAHTARLARI, AYAR_VARSAYILANLARI } from "@/lib/ayar-anahtarlar";

async function periyotGunOku(): Promise<number> {
  const k = await prisma.ayar.findUnique({
    where: { anahtar: AYAR_ANAHTARLARI.gorusmePeriyotGun },
    select: { deger: true },
  });
  const v =
    k?.deger ?? AYAR_VARSAYILANLARI[AYAR_ANAHTARLARI.gorusmePeriyotGun];
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 14;
}

export default async function AdminAnasayfa() {
  const son30 = new Date();
  son30.setDate(son30.getDate() - 30);

  const periyotGun = await periyotGunOku();
  const gecikmeEsigi = new Date(Date.now() - periyotGun * 86400000);

  const [
    toplam,
    rolBazli,
    bekleyenOgrenci,
    bekleyenKoc,
    bekleyenGorusme,
    onayliGorusme30,
    aktifEslesmeler,
    sonLoglar,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["rol"], _count: { _all: true } }),
    prisma.ogrenciKayitBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
    prisma.kocOnBasvuru.count({ where: { durum: "BEKLEMEDE" } }),
    prisma.gorusme.count({ where: { durum: "GONDERILDI" } }),
    prisma.gorusme.count({
      where: { durum: "ONAYLANDI", tarih: { gte: son30 } },
    }),
    prisma.ogrenciKocEslestirme.findMany({
      where: { aktif: true },
      select: { ogrenciId: true, kocId: true },
    }),
    prisma.sistemLog.findMany({
      orderBy: { tarih: "desc" },
      take: 8,
      include: { actor: { select: { ad: true, soyad: true } } },
    }),
  ]);

  let geciken = 0;
  for (const e of aktifEslesmeler) {
    const son = await prisma.gorusme.findFirst({
      where: { kocId: e.kocId, ogrenciId: e.ogrenciId, durum: "ONAYLANDI" },
      orderBy: { tarih: "desc" },
      select: { tarih: true },
    });
    if (!son || son.tarih < gecikmeEsigi) geciken++;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin Paneli</h1>
      <p className="mt-1 text-sm text-slate-600">Sisteme genel bakış.</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Toplam kullanıcı
            </div>
            <div className="mt-1 text-3xl font-semibold">{toplam}</div>
          </CardBody>
        </Card>
        {rolBazli.map((r) => (
          <Card key={r.rol}>
            <CardBody>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {ROL_ETIKETLERI[r.rol]}
              </div>
              <div className="mt-1 text-3xl font-semibold">{r._count._all}</div>
            </CardBody>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Bekleyen öğrenci başvurusu
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold">{bekleyenOgrenci}</span>
              <Link
                href="/admin/basvurular/ogrenci"
                className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
              >
                Aç
              </Link>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Bekleyen koç başvurusu
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold">{bekleyenKoc}</span>
              <Link
                href="/admin/basvurular/koc"
                className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
              >
                Aç
              </Link>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Onayı bekleyen görüşme
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold">{bekleyenGorusme}</span>
              <Link
                href="/admin/gorusmeler"
                className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
              >
                Aç
              </Link>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Geciken görüşme (eşleşme bazlı)
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-3xl font-semibold">{geciken}</span>
              <Badge tonu="uyari">{periyotGun} gün eşiği</Badge>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son 30 günde onaylanan görüşme
            </div>
            <div className="mt-1 text-3xl font-semibold">{onayliGorusme30}</div>
            <Link
              href="/admin/raporlar"
              className="mt-2 inline-block text-sm text-slate-700 underline-offset-2 hover:underline"
            >
              Raporlara git →
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Son sistem hareketleri
            </div>
            <ul className="space-y-1.5 text-sm">
              {sonLoglar.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate font-mono text-xs text-slate-600">
                    {l.action}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {l.actor
                      ? `${l.actor.ad} ${l.actor.soyad}`
                      : "sistem"}{" "}
                    ·{" "}
                    {l.tarih.toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </li>
              ))}
              {sonLoglar.length === 0 ? (
                <li className="text-slate-500">Kayıt yok.</li>
              ) : null}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
