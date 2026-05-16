import Link from "next/link";
import { prisma } from "@/lib/db";
import { YeniKullaniciForm } from "./yeni-form";

export default async function YeniKullaniciSayfasi() {
  const veliKullanicilari = await prisma.user.findMany({
    where: { rol: "VELI", aktif: true },
    orderBy: { ad: "asc" },
    select: {
      id: true,
      ad: true,
      soyad: true,
      telefon: true,
    },
    take: 200,
  });

  const veliler = veliKullanicilari.map((v) => ({
    userId: v.id,
    ad: v.ad,
    soyad: v.soyad,
    telefon: v.telefon,
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/admin/kullanicilar"
        className="text-sm text-slate-500 hover:underline"
      >
        ← Kullanıcılar
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Yeni kullanıcı</h1>
      <p className="mt-1 text-sm text-slate-600">
        Aşağıdaki bilgileri doldurarak yeni bir hesap oluşturun.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <YeniKullaniciForm veliler={veliler} />
      </div>
    </div>
  );
}
