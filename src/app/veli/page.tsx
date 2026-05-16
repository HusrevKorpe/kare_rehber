import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { requireRole } from "@/server/auth";

export default async function VeliAnasayfa() {
  const session = await requireRole("VELI");
  const vp = await prisma.veliProfil.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!vp) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Veli Paneli</h1>
        <p className="mt-2 text-sm text-slate-600">
          Veli profiliniz bulunamadı.
        </p>
      </main>
    );
  }

  const [cocuklar, sonGorusmeler, okunmamisMesaj] = await Promise.all([
    prisma.ogrenciProfil.findMany({
      where: { veliId: vp.id },
      include: {
        user: { select: { ad: true, soyad: true } },
        kocEslestirmeleri: {
          where: { aktif: true },
          include: {
            koc: { include: { user: { select: { ad: true, soyad: true } } } },
          },
        },
      },
    }),
    prisma.gorusme.findMany({
      where: {
        durum: "ONAYLANDI",
        ogrenci: { veliId: vp.id },
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
      <h1 className="text-2xl font-semibold">Veli Paneli</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Çocuk sayım
            </div>
            <div className="mt-1 text-3xl font-semibold">{cocuklar.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Son görüşmeler
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
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Çocuklarım</h2>
        {cocuklar.length === 0 ? (
          <Card>
            <CardBody className="text-sm text-slate-500">
              Tanımlı çocuk yok.
            </CardBody>
          </Card>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {cocuklar.map((c) => {
              const koc = c.kocEslestirmeleri[0]?.koc.user;
              return (
                <li key={c.id}>
                  <Card>
                    <CardBody>
                      <div className="text-sm font-medium">
                        {c.user.ad} {c.user.soyad}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {koc ? `Koç: ${koc.ad} ${koc.soyad}` : "Koç atanmadı"}
                      </div>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Son görüşmeler
        </h2>
        <Card>
          <CardBody>
            {sonGorusmeler.length === 0 ? (
              <p className="text-sm text-slate-500">Onaylı görüşme yok.</p>
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
