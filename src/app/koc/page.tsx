import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/server/auth";

export default async function KocAnasayfa() {
  const session = await requireRole("KOC");
  const kp = await prisma.kocProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true, durum: true },
  });

  if (!kp) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Koç Paneli</h1>
        <p className="mt-2 text-sm text-slate-600">Koç profiliniz bulunamadı.</p>
      </main>
    );
  }

  const son30 = new Date();
  son30.setDate(son30.getDate() - 30);

  const [aktifEslesme, bekleyenGorusme, onayliGorusme30, okunmamisMesaj] =
    await Promise.all([
      prisma.ogrenciKocEslestirme.findMany({
        where: { kocId: kp.id, aktif: true },
        include: {
          ogrenci: {
            include: { user: { select: { id: true, ad: true, soyad: true } } },
          },
        },
      }),
      prisma.gorusme.count({
        where: { kocId: kp.id, durum: "GONDERILDI" },
      }),
      prisma.gorusme.count({
        where: { kocId: kp.id, durum: "ONAYLANDI", tarih: { gte: son30 } },
      }),
      prisma.mesaj.count({
        where: { aliciId: session.user.id, okundu: false },
      }),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Koç Paneli</h1>
        <Badge
          tonu={
            kp.durum === "AKTIF" ? "basari" : kp.durum === "HAVUZ" ? "bilgi" : "notr"
          }
        >
          {kp.durum}
        </Badge>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Aktif öğrencim
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {aktifEslesme.length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Onay bekleyen görüşmem
            </div>
            <div className="mt-1 text-3xl font-semibold">{bekleyenGorusme}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son 30 günde onaylanan
            </div>
            <div className="mt-1 text-3xl font-semibold">{onayliGorusme30}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Okunmamış mesaj
            </div>
            <div className="mt-1 text-3xl font-semibold">{okunmamisMesaj}</div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Öğrencilerim
        </h2>
        {aktifEslesme.length === 0 ? (
          <Card>
            <CardBody className="text-sm text-slate-500">
              Henüz size atanmış aktif öğrenci yok.
            </CardBody>
          </Card>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {aktifEslesme.map((e) => (
              <li key={e.id}>
                <Card>
                  <CardBody className="flex items-center justify-between">
                    <Link
                      href={`/koc/ogrenci/${e.ogrenci.user.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {e.ogrenci.user.ad} {e.ogrenci.user.soyad}
                    </Link>
                    <Link
                      href="/koc/gorusmeler/yeni"
                      className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                    >
                      Görüşme aç →
                    </Link>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
