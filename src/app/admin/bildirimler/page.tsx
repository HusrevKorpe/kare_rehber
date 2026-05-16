import { BildirimListesi } from "@/components/app/bildirim-listesi";
import { PushAboneButonu } from "@/components/app/push-abone-butonu";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Bildirimler" };

export default function BildirimlerPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Bildirimler</h1>
      <Card>
        <CardHeader>
          <CardTitle>Push bildirimleri</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-slate-600">
            Tarayıcı kapalıyken bile yeni bildirimleri anlık alabilirsin.
          </p>
          <PushAboneButonu />
        </CardBody>
      </Card>
      <BildirimListesi />
    </div>
  );
}
