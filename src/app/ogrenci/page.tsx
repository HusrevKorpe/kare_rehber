import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { requireRole } from "@/server/auth";

export default async function OgrenciAnasayfa() {
  const session = await requireRole("OGRENCI");
  const op = await prisma.ogrenciProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true, il: true, ilce: true, sinif: true, okul: true },
  });

  if (!op) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Öğrenci Paneli</h1>
        <p className="mt-2 text-sm text-slate-600">
          Öğrenci profiliniz bulunamadı.
        </p>
      </main>
    );
  }

  const [aktifKoc, sonGorusme, toplamGorusme, okunmamisMesaj] =
    await Promise.all([
      prisma.ogrenciKocEslestirme.findFirst({
        where: { ogrenciId: op.id, aktif: true },
        include: {
          koc: { include: { user: { select: { ad: true, soyad: true } } } },
        },
      }),
      prisma.gorusme.findFirst({
        where: { ogrenciId: op.id, durum: "ONAYLANDI" },
        orderBy: { tarih: "desc" },
        include: {
          koc: { include: { user: { select: { ad: true, soyad: true } } } },
        },
      }),
      prisma.gorusme.count({
        where: { ogrenciId: op.id, durum: "ONAYLANDI" },
      }),
      prisma.mesaj.count({
        where: { aliciId: session.user.id, okundu: false },
      }),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Öğrenci Paneli</h1>
      <p className="mt-1 text-sm text-slate-600">
        {op.il}
        {op.ilce ? `, ${op.ilce}` : ""}
        {op.okul ? ` — ${op.okul}` : ""}
        {op.sinif ? ` (${op.sinif})` : ""}
      </p>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Koçum
            </div>
            <div className="mt-1 text-lg font-semibold">
              {aktifKoc
                ? `${aktifKoc.koc.user.ad} ${aktifKoc.koc.user.soyad}`
                : "Henüz atanmadı"}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Toplam görüşme
            </div>
            <div className="mt-1 text-3xl font-semibold">{toplamGorusme}</div>
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
          Son görüşmem
        </h2>
        <Card>
          <CardBody>
            {sonGorusme ? (
              <div className="space-y-1">
                <div className="text-sm">
                  <strong>{sonGorusme.tarih.toLocaleDateString("tr-TR")}</strong>{" "}
                  — {sonGorusme.koc.user.ad} {sonGorusme.koc.user.soyad}
                </div>
                {sonGorusme.konu ? (
                  <div className="text-sm text-slate-700">{sonGorusme.konu}</div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Henüz onaylı görüşme kaydı yok.
              </p>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
