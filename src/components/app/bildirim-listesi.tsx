import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  bildirimleriListele,
  bildirimOkundu,
  hepsiniOkunduYap,
} from "@/server/bildirim";

function tarihFmt(d: Date) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function okundu(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (id) await bildirimOkundu(id);
}

async function hepsi() {
  "use server";
  await hepsiniOkunduYap();
  revalidatePath("/admin/bildirimler");
  revalidatePath("/koc/bildirimler");
  revalidatePath("/koordinator/bildirimler");
  revalidatePath("/ogrenci/bildirimler");
  revalidatePath("/veli/bildirimler");
}

export async function BildirimListesi() {
  const bildirimler = await bildirimleriListele(100);
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Toplam {bildirimler.length} bildirim
          {okunmamis > 0 ? `, ${okunmamis} okunmamış` : ""}.
        </div>
        {okunmamis > 0 ? (
          <form action={hepsi}>
            <Button type="submit" variant="outline" size="sm">
              Hepsini okundu yap
            </Button>
          </form>
        ) : null}
      </div>

      {bildirimler.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">
          Henüz bildiriminiz yok.
        </Card>
      ) : (
        <ul className="space-y-2">
          {bildirimler.map((b) => (
            <li key={b.id}>
              <Card
                className={
                  b.okundu
                    ? "p-4"
                    : "border-l-4 border-l-slate-900 bg-slate-50/60 p-4"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {b.baslik}
                      </span>
                      {!b.okundu ? (
                        <span className="inline-block size-2 rounded-full bg-red-500" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{b.icerik}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      {tarihFmt(b.tarih)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {b.link ? (
                      <Link
                        href={b.link}
                        className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                      >
                        Aç
                      </Link>
                    ) : null}
                    {!b.okundu ? (
                      <form action={okundu}>
                        <input type="hidden" name="id" value={b.id} />
                        <button
                          type="submit"
                          className="text-xs text-slate-500 hover:text-slate-900"
                        >
                          Okundu işaretle
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
