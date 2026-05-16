"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/server/auth";
import type { BildirimTipi } from "@/generated/prisma/enums";
import { pushGonderKullanicilara } from "@/lib/push";

export type BildirimSonuc<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { veri: T }))
  | { ok: false; hata: string };

type BildirimGirdi = {
  kullaniciId: string;
  tip: BildirimTipi;
  baslik: string;
  icerik: string;
  link?: string | null;
};

export async function bildirimGonder(input: BildirimGirdi) {
  await prisma.bildirim.create({
    data: {
      kullaniciId: input.kullaniciId,
      tip: input.tip,
      baslik: input.baslik,
      icerik: input.icerik,
      link: input.link ?? null,
    },
  });
  await pushGonderKullanicilara([input.kullaniciId], {
    baslik: input.baslik,
    icerik: input.icerik,
    link: input.link ?? null,
    tip: input.tip,
  });
}

export async function bildirimCoklu(girdiler: BildirimGirdi[]) {
  if (girdiler.length === 0) return;
  await prisma.bildirim.createMany({
    data: girdiler.map((g) => ({
      kullaniciId: g.kullaniciId,
      tip: g.tip,
      baslik: g.baslik,
      icerik: g.icerik,
      link: g.link ?? null,
    })),
  });
  // Aynı içerikse tek gönderim grupla; farklılarsa kullanıcı başına gönder.
  const ilk = girdiler[0];
  const tekTip = girdiler.every(
    (g) =>
      g.tip === ilk.tip &&
      g.baslik === ilk.baslik &&
      g.icerik === ilk.icerik &&
      (g.link ?? null) === (ilk.link ?? null),
  );
  if (tekTip) {
    await pushGonderKullanicilara(
      girdiler.map((g) => g.kullaniciId),
      {
        baslik: ilk.baslik,
        icerik: ilk.icerik,
        link: ilk.link ?? null,
        tip: ilk.tip,
      },
    );
  } else {
    await Promise.all(
      girdiler.map((g) =>
        pushGonderKullanicilara([g.kullaniciId], {
          baslik: g.baslik,
          icerik: g.icerik,
          link: g.link ?? null,
          tip: g.tip,
        }),
      ),
    );
  }
}

export async function rolBazliBildirim(
  roller: ("ADMIN" | "KOORDINATOR" | "KOC" | "OGRENCI" | "VELI")[],
  girdi: Omit<BildirimGirdi, "kullaniciId">,
) {
  const kullanicilar = await prisma.user.findMany({
    where: { rol: { in: roller }, aktif: true },
    select: { id: true },
  });
  if (kullanicilar.length === 0) return;
  await prisma.bildirim.createMany({
    data: kullanicilar.map((u) => ({
      kullaniciId: u.id,
      tip: girdi.tip,
      baslik: girdi.baslik,
      icerik: girdi.icerik,
      link: girdi.link ?? null,
    })),
  });
  await pushGonderKullanicilara(
    kullanicilar.map((u) => u.id),
    {
      baslik: girdi.baslik,
      icerik: girdi.icerik,
      link: girdi.link ?? null,
      tip: girdi.tip,
    },
  );
}

export async function bildirimleriListele(limit = 50) {
  const session = await requireSession();
  return prisma.bildirim.findMany({
    where: { kullaniciId: session.user.id },
    orderBy: { tarih: "desc" },
    take: limit,
  });
}

export async function okunmamisBildirimSayisi() {
  const session = await requireSession();
  return prisma.bildirim.count({
    where: { kullaniciId: session.user.id, okundu: false },
  });
}

export async function bildirimOkundu(
  id: string,
): Promise<BildirimSonuc> {
  const session = await requireSession();
  const b = await prisma.bildirim.findUnique({
    where: { id },
    select: { kullaniciId: true, okundu: true },
  });
  if (!b) return { ok: false, hata: "Bildirim bulunamadı." };
  if (b.kullaniciId !== session.user.id) {
    return { ok: false, hata: "Bu bildirim size ait değil." };
  }
  if (!b.okundu) {
    await prisma.bildirim.update({
      where: { id },
      data: { okundu: true, okunmaTarihi: new Date() },
    });
  }
  revalidatePath("/admin/bildirimler");
  revalidatePath("/koc/bildirimler");
  revalidatePath("/koordinator/bildirimler");
  revalidatePath("/ogrenci/bildirimler");
  revalidatePath("/veli/bildirimler");
  return { ok: true };
}

export async function hepsiniOkunduYap(): Promise<BildirimSonuc> {
  const session = await requireSession();
  await prisma.bildirim.updateMany({
    where: { kullaniciId: session.user.id, okundu: false },
    data: { okundu: true, okunmaTarihi: new Date() },
  });
  revalidatePath("/admin/bildirimler");
  revalidatePath("/koc/bildirimler");
  revalidatePath("/koordinator/bildirimler");
  revalidatePath("/ogrenci/bildirimler");
  revalidatePath("/veli/bildirimler");
  return { ok: true };
}
