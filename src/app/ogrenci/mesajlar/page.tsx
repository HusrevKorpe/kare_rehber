import { MesajPaneli } from "@/components/app/mesaj-paneli";
import {
  aliciAdaylari,
  mesajKonusma,
  mesajKonusmalar,
} from "@/server/mesaj";

type SearchParams = Promise<{ ile?: string }>;

export default async function OgrenciMesajlarSayfasi({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const partnerId = sp.ile?.trim() || null;

  const [konusmalar, alicilar, aktif] = await Promise.all([
    mesajKonusmalar(),
    aliciAdaylari(),
    partnerId
      ? mesajKonusma(partnerId)
      : Promise.resolve({ partner: null, mesajlar: [] }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Mesajlar</h1>
      <div className="mt-6">
        <MesajPaneli
          panelHref="/ogrenci/mesajlar"
          konusmalar={konusmalar}
          aliciAdaylari={alicilar}
          aktifPartner={aktif.partner}
          aktifMesajlar={aktif.mesajlar}
        />
      </div>
    </div>
  );
}
