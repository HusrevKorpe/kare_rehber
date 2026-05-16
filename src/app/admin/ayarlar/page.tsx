import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AYAR_ANAHTARLARI } from "@/lib/ayar-anahtarlar";
import { ayarlariOku } from "@/server/ayar";
import { AyarFormu } from "./ayar-formu";

export default async function AyarlarSayfasi() {
  const ayarlar = await ayarlariOku();
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sistem genelinde uygulanan parametreler.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Genel</CardTitle>
        </CardHeader>
        <CardBody>
          <AyarFormu
            varsayilan={{
              gorusmePeriyotGun:
                ayarlar[AYAR_ANAHTARLARI.gorusmePeriyotGun] ?? "14",
              appAdi: ayarlar[AYAR_ANAHTARLARI.appAdi] ?? "KARE-Rehber",
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
