import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { telGosterim } from "@/lib/phone";
import { formatTr } from "@/lib/utils";
import type { KullaniciDuzenleGirdi } from "@/lib/validation/kullanici";
import { getSession } from "@/server/auth";
import { AksiyonPaneli } from "./aksiyon-formu";
import { KullaniciDuzenleForm } from "./duzenle-form";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ olusturuldu?: string }>;

function tarihInput(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

export default async function KullaniciDuzenleSayfasi({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const yeniOlusturuldu = sp.olusturuldu === "1";

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ogrenciProfil: true,
      kocProfil: true,
      koordinatorProfil: true,
    },
  });

  if (!user) notFound();

  const session = await getSession();
  const kendisi = session?.user?.id === user.id;

  const baslangic: KullaniciDuzenleGirdi = {
    ad: user.ad,
    soyad: user.soyad,
    telefon: user.telefon,
    dogumTarihi: tarihInput(user.dogumTarihi),
    email: user.email ?? undefined,
    vakifAdi: user.koordinatorProfil?.vakifAdi,
    il:
      user.koordinatorProfil?.il ??
      user.ogrenciProfil?.il ??
      undefined,
    ilce: user.ogrenciProfil?.ilce ?? undefined,
    sinif: user.ogrenciProfil?.sinif ?? undefined,
    okul: user.ogrenciProfil?.okul ?? undefined,
    uzmanlik: user.kocProfil?.uzmanlik ?? undefined,
    durum: user.kocProfil?.durum,
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/admin/kullanicilar"
        className="text-sm text-slate-500 hover:underline"
      >
        ← Kullanıcılar
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {user.ad} {user.soyad}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Badge tonu="bilgi">{ROL_ETIKETLERI[user.rol]}</Badge>
            {user.aktif ? (
              <Badge tonu="basari">Aktif</Badge>
            ) : (
              <Badge tonu="hata">Pasif</Badge>
            )}
            <span>{telGosterim(user.telefon)}</span>
            <span>·</span>
            <span>Kayıt: {formatTr(user.olusturulma)}</span>
          </div>
        </div>
      </div>

      {yeniOlusturuldu ? (
        <Alert tonu="basari" className="mt-4">
          Kullanıcı oluşturuldu. Parola SMS ile telefonuna gönderildi.
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Bilgileri düzenle</CardTitle>
          </CardHeader>
          <CardBody>
            <KullaniciDuzenleForm
              id={user.id}
              rol={user.rol}
              baslangic={baslangic}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hesap aksiyonları</CardTitle>
          </CardHeader>
          <CardBody>
            <AksiyonPaneli
              id={user.id}
              aktif={user.aktif}
              kendisi={kendisi}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
