import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { requireRole } from "@/server/auth";

export default async function KoordinatorAnasayfa() {
  const session = await requireRole("KOORDINATOR");
  const kp = await prisma.koordinatorProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true, vakifAdi: true, il: true },
  });

  if (!kp) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Koordinatör Paneli</h1>
        <p className="mt-2 text-sm text-slate-600">
          Koordinatör profiliniz bulunamadı.
        </p>
      </main>
    );
  }

  const son30 = new Date();
  son30.setDate(son30.getDate() - 30);

  const [aktifOgrenci, sonGorusmeler, okunmamisMesaj] = await Promise.all([
    prisma.ogrenciKoordinatorEslestirme.count({
      where: { koordinatorId: kp.id, aktif: true },
    }),
    prisma.gorusme.findMany({
      where: {
        durum: "ONAYLANDI",
        tarih: { gte: son30 },
        ogrenci: {
          koordinatorEslestirmeleri: {
            some: { koordinatorId: kp.id, aktif: true },
          },
        },
      },
      orderBy: { tarih: "desc" },
      take: 8,
      include: {
        koc: { include: { user: { select: { ad: true, soyad: true } } } },
        ogrenci: {
          include: { user: { select: { ad: true, soyad: true } } },
        },
      },
    }),
    prisma.mesaj.count({
      where: { aliciId: session.user.id, okundu: false },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Koordinatör Paneli</h1>
      <p className="mt-1 text-sm text-slate-600">
        {kp.vakifAdi}
        {kp.il ? ` — ${kp.il}` : ""}
      </p>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Sorumlu olduğum öğrenci
            </div>
            <div className="mt-1 text-3xl font-semibold">{aktifOgrenci}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son 30 günde görüşme
            </div>
            <div className="mt-1 text-3xl font-semibold">
              {sonGorusmeler.length}
            </div>
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
          Son görüşmeler
        </h2>
        <Card>
          <CardBody>
            {sonGorusmeler.length === 0 ? (
              <p className="text-sm text-slate-500">Son 30 günde görüşme yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sonGorusmeler.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="text-sm">
                      <strong>
                        {g.ogrenci.user.ad} {g.ogrenci.user.soyad}
                      </strong>{" "}
                      — {g.koc.user.ad} {g.koc.user.soyad}
                    </span>
                    <span className="text-xs text-slate-500">
                      {g.tarih.toLocaleDateString("tr-TR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
