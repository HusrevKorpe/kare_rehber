import "server-only";
import { prisma } from "@/lib/db";
import type { Rol } from "@/generated/prisma/enums";

export type AliciAdayi = {
  id: string;
  ad: string;
  soyad: string;
  rol: Rol;
};

// Bir kullanıcının mesajlaşabileceği User.id kümesini döndürür.
// Roller:
//   ADMIN          → herkes (aktif kullanıcılar, kendisi hariç)
//   KOC            → aktif eşleştiği öğrenciler + onların velileri + öğrencilerinin koordinatörleri + ADMIN'ler
//   OGRENCI        → aktif eşleştiği koç + aktif eşleştiği koordinatör + kendi velisi + ADMIN'ler
//   VELI           → çocuklarının aktif koçları + çocuklarının aktif koordinatörleri + çocukları + ADMIN'ler
//   KOORDINATOR    → aktif eşleştiği öğrenciler + onların velileri + öğrencilerinin koçları + ADMIN'ler
export async function ulasilabilirKullaniciIdleri(
  userId: string,
  rol: Rol,
): Promise<Set<string>> {
  const set = new Set<string>();

  // ADMIN tüm aktif kullanıcılara erişebilir.
  if (rol === "ADMIN") {
    const hepsi = await prisma.user.findMany({
      where: { aktif: true, id: { not: userId } },
      select: { id: true },
    });
    for (const u of hepsi) set.add(u.id);
    return set;
  }

  // Non-admin için: tüm aktif adminler dahil.
  const adminler = await prisma.user.findMany({
    where: { rol: "ADMIN", aktif: true, id: { not: userId } },
    select: { id: true },
  });
  for (const a of adminler) set.add(a.id);

  if (rol === "KOC") {
    const koc = await prisma.kocProfil.findUnique({
      where: { userId },
      select: {
        ogrenciEslestirmeleri: {
          where: { aktif: true },
          select: {
            ogrenci: {
              select: {
                user: { select: { id: true, aktif: true } },
                veli: { select: { user: { select: { id: true, aktif: true } } } },
                koordinatorEslestirmeleri: {
                  where: { aktif: true },
                  select: {
                    koordinator: { select: { user: { select: { id: true, aktif: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });
    for (const e of koc?.ogrenciEslestirmeleri ?? []) {
      if (e.ogrenci.user.aktif) set.add(e.ogrenci.user.id);
      const veliUser = e.ogrenci.veli?.user;
      if (veliUser?.aktif) set.add(veliUser.id);
      for (const ke of e.ogrenci.koordinatorEslestirmeleri) {
        if (ke.koordinator.user.aktif) set.add(ke.koordinator.user.id);
      }
    }
  } else if (rol === "OGRENCI") {
    const ogr = await prisma.ogrenciProfil.findUnique({
      where: { userId },
      select: {
        veli: { select: { user: { select: { id: true, aktif: true } } } },
        kocEslestirmeleri: {
          where: { aktif: true },
          select: { koc: { select: { user: { select: { id: true, aktif: true } } } } },
        },
        koordinatorEslestirmeleri: {
          where: { aktif: true },
          select: {
            koordinator: { select: { user: { select: { id: true, aktif: true } } } },
          },
        },
      },
    });
    const veliUser = ogr?.veli?.user;
    if (veliUser?.aktif) set.add(veliUser.id);
    for (const e of ogr?.kocEslestirmeleri ?? []) {
      if (e.koc.user.aktif) set.add(e.koc.user.id);
    }
    for (const e of ogr?.koordinatorEslestirmeleri ?? []) {
      if (e.koordinator.user.aktif) set.add(e.koordinator.user.id);
    }
  } else if (rol === "VELI") {
    const veli = await prisma.veliProfil.findUnique({
      where: { userId },
      select: {
        ogrenciler: {
          select: {
            user: { select: { id: true, aktif: true } },
            kocEslestirmeleri: {
              where: { aktif: true },
              select: { koc: { select: { user: { select: { id: true, aktif: true } } } } },
            },
            koordinatorEslestirmeleri: {
              where: { aktif: true },
              select: {
                koordinator: { select: { user: { select: { id: true, aktif: true } } } },
              },
            },
          },
        },
      },
    });
    for (const o of veli?.ogrenciler ?? []) {
      if (o.user.aktif) set.add(o.user.id);
      for (const e of o.kocEslestirmeleri) {
        if (e.koc.user.aktif) set.add(e.koc.user.id);
      }
      for (const e of o.koordinatorEslestirmeleri) {
        if (e.koordinator.user.aktif) set.add(e.koordinator.user.id);
      }
    }
  } else if (rol === "KOORDINATOR") {
    const koord = await prisma.koordinatorProfil.findUnique({
      where: { userId },
      select: {
        ogrenciEslestirmeleri: {
          where: { aktif: true },
          select: {
            ogrenci: {
              select: {
                user: { select: { id: true, aktif: true } },
                veli: { select: { user: { select: { id: true, aktif: true } } } },
                kocEslestirmeleri: {
                  where: { aktif: true },
                  select: { koc: { select: { user: { select: { id: true, aktif: true } } } } },
                },
              },
            },
          },
        },
      },
    });
    for (const e of koord?.ogrenciEslestirmeleri ?? []) {
      if (e.ogrenci.user.aktif) set.add(e.ogrenci.user.id);
      const veliUser = e.ogrenci.veli?.user;
      if (veliUser?.aktif) set.add(veliUser.id);
      for (const ke of e.ogrenci.kocEslestirmeleri) {
        if (ke.koc.user.aktif) set.add(ke.koc.user.id);
      }
    }
  }

  set.delete(userId);
  return set;
}

export async function aliciAdaylariIcin(
  userId: string,
  rol: Rol,
): Promise<AliciAdayi[]> {
  const idler = await ulasilabilirKullaniciIdleri(userId, rol);
  if (idler.size === 0) return [];
  const kullanicilar = await prisma.user.findMany({
    where: { id: { in: [...idler] }, aktif: true },
    orderBy: [{ rol: "asc" }, { ad: "asc" }, { soyad: "asc" }],
    select: { id: true, ad: true, soyad: true, rol: true },
  });
  return kullanicilar;
}

export async function mesajIzinli(
  gondericiId: string,
  gondericiRol: Rol,
  aliciId: string,
): Promise<boolean> {
  if (gondericiId === aliciId) return false;
  const set = await ulasilabilirKullaniciIdleri(gondericiId, gondericiRol);
  return set.has(aliciId);
}
