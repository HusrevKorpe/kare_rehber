import webpush, { type PushSubscription as WebPushSub } from "web-push";
import { prisma } from "@/lib/db";

let kuruldu = false;

function vapidKur() {
  if (kuruldu) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  kuruldu = true;
}

export type PushYuk = {
  baslik: string;
  icerik: string;
  link?: string | null;
  tip?: string;
};

export async function pushGonderKullaniciya(
  kullaniciId: string,
  yuk: PushYuk,
): Promise<void> {
  vapidKur();
  if (!kuruldu) return;

  const abonelikler = await prisma.pushAbonelik.findMany({
    where: { kullaniciId },
  });
  if (abonelikler.length === 0) return;

  const veri = JSON.stringify({
    baslik: yuk.baslik,
    icerik: yuk.icerik,
    link: yuk.link ?? "/",
    tip: yuk.tip ?? "SISTEM",
  });

  const olu: string[] = [];
  await Promise.all(
    abonelikler.map(async (a) => {
      const sub: WebPushSub = {
        endpoint: a.endpoint,
        keys: { p256dh: a.p256dh, auth: a.auth },
      };
      try {
        await webpush.sendNotification(sub, veri);
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          olu.push(a.id);
        } else {
          console.error("[push] gönderim hatası", err);
        }
      }
    }),
  );

  if (olu.length > 0) {
    await prisma.pushAbonelik.deleteMany({ where: { id: { in: olu } } });
  }
}

export async function pushGonderKullanicilara(
  kullaniciIdler: string[],
  yuk: PushYuk,
): Promise<void> {
  await Promise.all(kullaniciIdler.map((id) => pushGonderKullaniciya(id, yuk)));
}
