import type { Rol } from "@/generated/prisma/enums";
import type { MenuOge } from "@/components/app/panel-shell";

export const PANEL_MENULERI: Record<Rol, MenuOge[]> = {
  ADMIN: [
    { href: "/admin", baslik: "Anasayfa" },
    { href: "/admin/kullanicilar", baslik: "Kullanıcılar" },
    { href: "/admin/basvurular/ogrenci", baslik: "Öğrenci başvuruları" },
    { href: "/admin/basvurular/koc", baslik: "Koç başvuruları" },
    { href: "/admin/eslestirme", baslik: "Eşleştirme" },
    { href: "/admin/gorusmeler", baslik: "Görüşmeler" },
    { href: "/admin/mesajlar", baslik: "Mesajlar" },
    { href: "/admin/bildirimler", baslik: "Bildirimler" },
    { href: "/admin/raporlar", baslik: "Raporlar" },
    { href: "/admin/raporlar/koc-skoru", baslik: "Koç skoru" },
    { href: "/admin/audit", baslik: "Denetim kayıtları" },
    { href: "/admin/ayarlar", baslik: "Ayarlar" },
  ],
  KOORDINATOR: [
    { href: "/koordinator", baslik: "Anasayfa" },
    { href: "/koordinator/gorusmeler", baslik: "Görüşmeler" },
    { href: "/koordinator/mesajlar", baslik: "Mesajlar" },
    { href: "/koordinator/bildirimler", baslik: "Bildirimler" },
    { href: "/koordinator/ogrencilerim", baslik: "Öğrencilerim", yakinda: true },
  ],
  KOC: [
    { href: "/koc", baslik: "Anasayfa" },
    { href: "/koc/gorusmeler", baslik: "Görüşmelerim" },
    { href: "/koc/skor", baslik: "Skorum" },
    { href: "/koc/mesajlar", baslik: "Mesajlar" },
    { href: "/koc/bildirimler", baslik: "Bildirimler" },
    { href: "/koc/ogrencilerim", baslik: "Öğrencilerim", yakinda: true },
  ],
  OGRENCI: [
    { href: "/ogrenci", baslik: "Anasayfa" },
    { href: "/ogrenci/gorusmelerim", baslik: "Görüşmelerim" },
    { href: "/ogrenci/mesajlar", baslik: "Mesajlar" },
    { href: "/ogrenci/bildirimler", baslik: "Bildirimler" },
    { href: "/ogrenci/kocum", baslik: "Koçum", yakinda: true },
  ],
  VELI: [
    { href: "/veli", baslik: "Anasayfa" },
    { href: "/veli/gorusmeler", baslik: "Görüşmeler" },
    { href: "/veli/mesajlar", baslik: "Mesajlar" },
    { href: "/veli/bildirimler", baslik: "Bildirimler" },
    { href: "/veli/cocuklarim", baslik: "Çocuklarım", yakinda: true },
  ],
};
