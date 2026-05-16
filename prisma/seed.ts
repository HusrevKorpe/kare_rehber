import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminTelefon = process.env.SEED_ADMIN_TELEFON ?? "+905555555555";
  const adminParola = process.env.SEED_ADMIN_PAROLA ?? "Admin1234!";

  let admin = await prisma.user.findUnique({ where: { telefon: adminTelefon } });
  if (!admin) {
    const sifreHash = await bcrypt.hash(adminParola, 10);
    admin = await prisma.user.create({
      data: {
        ad: process.env.SEED_ADMIN_AD ?? "Sistem",
        soyad: process.env.SEED_ADMIN_SOYAD ?? "Yönetici",
        telefon: adminTelefon,
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@kare.local",
        sifreHash,
        rol: "ADMIN",
      },
    });
    console.log(`Admin oluşturuldu: ${admin.telefon}`);
  } else {
    console.log(`Admin zaten mevcut: ${admin.telefon}`);
  }

  // ── Test öğrenci ───────────────────────────────────────────────────────────
  const testOgrenciTelefon = "+905550000001";
  let testOgrenciUser = await prisma.user.findUnique({ where: { telefon: testOgrenciTelefon } });
  if (!testOgrenciUser) {
    testOgrenciUser = await prisma.user.create({
      data: {
        ad: "Test",
        soyad: "Öğrenci",
        telefon: testOgrenciTelefon,
        dogumTarihi: new Date("2010-01-15"),
        rol: "OGRENCI",
        ogrenciProfil: {
          create: { il: "İstanbul", ilce: "Kadıköy", sinif: "8. Sınıf", okul: "Kadıköy Ortaokulu" },
        },
      },
    });
    console.log(`Test öğrenci oluşturuldu: ${testOgrenciUser.telefon} / doğum: 2010-01-15`);
  } else {
    console.log(`Test öğrenci zaten mevcut: ${testOgrenciUser.telefon}`);
  }
  const testOgrenciProfil = await prisma.ogrenciProfil.findUnique({
    where: { userId: testOgrenciUser.id },
  });

  const testSifre = await bcrypt.hash("Test1234!", 10);

  // ── Koordinatörler ─────────────────────────────────────────────────────────
  const koordinatorData = [
    { ad: "Zeynep", soyad: "Kaya", telefon: "+905550000010", email: "zeynep.kaya@kare.local", vakifAdi: "Gençlik Vakfı", il: "İstanbul" },
    { ad: "Mustafa", soyad: "Demir", telefon: "+905550000011", email: "mustafa.demir@kare.local", vakifAdi: "Eğitim Derneği", il: "Ankara" },
    { ad: "Ayşe", soyad: "Şahin", telefon: "+905550000012", email: "ayse.sahin@kare.local", vakifAdi: "Kare Vakfı", il: "İzmir" },
  ];

  const koordinatorler: { user: (typeof admin); profil: Awaited<ReturnType<typeof prisma.koordinatorProfil.findUnique>> }[] = [];
  for (const k of koordinatorData) {
    let user = await prisma.user.findUnique({ where: { telefon: k.telefon } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ad: k.ad,
          soyad: k.soyad,
          telefon: k.telefon,
          email: k.email,
          sifreHash: testSifre,
          rol: "KOORDINATOR",
          koordinatorProfil: { create: { vakifAdi: k.vakifAdi, il: k.il } },
        },
      });
      console.log(`Koordinatör oluşturuldu: ${user.telefon}`);
    }
    const profil = await prisma.koordinatorProfil.findUnique({ where: { userId: user.id } });
    koordinatorler.push({ user, profil });
  }

  // ── Koçlar ────────────────────────────────────────────────────────────────
  const kocData = [
    { ad: "Ahmet", soyad: "Yılmaz", telefon: "+905550000020", email: "ahmet.yilmaz@kare.local", uzmanlik: "Matematik", durum: "AKTIF" as const },
    { ad: "Fatma", soyad: "Arslan", telefon: "+905550000021", email: "fatma.arslan@kare.local", uzmanlik: "Türkçe / Edebiyat", durum: "AKTIF" as const },
    { ad: "Mehmet", soyad: "Çelik", telefon: "+905550000022", email: "mehmet.celik@kare.local", uzmanlik: "Fen Bilimleri", durum: "AKTIF" as const },
    { ad: "Elif", soyad: "Kara", telefon: "+905550000023", email: "elif.kara@kare.local", uzmanlik: "Sosyal Bilimler", durum: "AKTIF" as const },
    { ad: "Can", soyad: "Aydın", telefon: "+905550000024", email: "can.aydin@kare.local", uzmanlik: "İngilizce", durum: "AKTIF" as const },
    { ad: "Merve", soyad: "Doğan", telefon: "+905550000025", email: "merve.dogan@kare.local", uzmanlik: "Matematik", durum: "HAVUZ" as const },
    { ad: "Hasan", soyad: "Öztürk", telefon: "+905550000026", email: "hasan.ozturk@kare.local", uzmanlik: "Fen Bilimleri", durum: "HAVUZ" as const },
    { ad: "Selin", soyad: "Yıldız", telefon: "+905550000027", email: "selin.yildiz@kare.local", uzmanlik: "Türkçe", durum: "PASIF" as const },
  ];

  const koclar: { user: (typeof admin); profil: Awaited<ReturnType<typeof prisma.kocProfil.findUnique>> }[] = [];
  for (const k of kocData) {
    let user = await prisma.user.findUnique({ where: { telefon: k.telefon } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ad: k.ad,
          soyad: k.soyad,
          telefon: k.telefon,
          email: k.email,
          sifreHash: testSifre,
          rol: "KOC",
          kocProfil: { create: { uzmanlik: k.uzmanlik, durum: k.durum } },
        },
      });
      console.log(`Koç oluşturuldu: ${user.telefon}`);
    }
    const profil = await prisma.kocProfil.findUnique({ where: { userId: user.id } });
    koclar.push({ user, profil });
  }

  // ── Öğrenciler ────────────────────────────────────────────────────────────
  const ogrenciData = [
    { ad: "Ali", soyad: "Çelik", telefon: "+905550000030", dogumTarihi: "2008-03-15", il: "İstanbul", ilce: "Kadıköy", sinif: "10. Sınıf", okul: "Kadıköy Anadolu Lisesi" },
    { ad: "Büşra", soyad: "Kaya", telefon: "+905550000031", dogumTarihi: "2009-05-20", il: "İstanbul", ilce: "Beşiktaş", sinif: "9. Sınıf", okul: "Beşiktaş Lisesi" },
    { ad: "Emre", soyad: "Yıldız", telefon: "+905550000032", dogumTarihi: "2008-11-10", il: "Ankara", ilce: "Çankaya", sinif: "10. Sınıf", okul: "Çankaya Anadolu Lisesi" },
    { ad: "Naz", soyad: "Arslan", telefon: "+905550000033", dogumTarihi: "2009-02-28", il: "Ankara", ilce: "Keçiören", sinif: "9. Sınıf", okul: "Keçiören Lisesi" },
    { ad: "Yusuf", soyad: "Demir", telefon: "+905550000034", dogumTarihi: "2007-08-05", il: "İzmir", ilce: "Bornova", sinif: "11. Sınıf", okul: "Bornova Anadolu Lisesi" },
    { ad: "Gamze", soyad: "Şahin", telefon: "+905550000035", dogumTarihi: "2008-06-12", il: "İzmir", ilce: "Karşıyaka", sinif: "10. Sınıf", okul: "Karşıyaka Lisesi" },
    { ad: "Ömer", soyad: "Çetin", telefon: "+905550000036", dogumTarihi: "2009-09-03", il: "Bursa", ilce: "Nilüfer", sinif: "9. Sınıf", okul: "Nilüfer Anadolu Lisesi" },
    { ad: "Pınar", soyad: "Kılıç", telefon: "+905550000037", dogumTarihi: "2008-01-22", il: "Bursa", ilce: "Osmangazi", sinif: "10. Sınıf", okul: "Osmangazi Lisesi" },
    { ad: "İbrahim", soyad: "Akar", telefon: "+905550000038", dogumTarihi: "2007-12-18", il: "İstanbul", ilce: "Üsküdar", sinif: "11. Sınıf", okul: "Üsküdar Anadolu Lisesi" },
    { ad: "Seda", soyad: "Bozkurt", telefon: "+905550000039", dogumTarihi: "2009-07-14", il: "Ankara", ilce: "Etimesgut", sinif: "9. Sınıf", okul: "Etimesgut Lisesi" },
    { ad: "Kerem", soyad: "Güneş", telefon: "+905550000040", dogumTarihi: "2008-04-30", il: "İstanbul", ilce: "Ataşehir", sinif: "10. Sınıf", okul: "Ataşehir Anadolu Lisesi" },
    { ad: "Rana", soyad: "Polat", telefon: "+905550000041", dogumTarihi: "2009-10-08", il: "İzmir", ilce: "Konak", sinif: "9. Sınıf", okul: "Konak Lisesi" },
  ];

  const ogrenciler: { user: (typeof admin); profil: Awaited<ReturnType<typeof prisma.ogrenciProfil.findUnique>> }[] = [];
  for (const o of ogrenciData) {
    let user = await prisma.user.findUnique({ where: { telefon: o.telefon } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ad: o.ad,
          soyad: o.soyad,
          telefon: o.telefon,
          dogumTarihi: new Date(o.dogumTarihi),
          rol: "OGRENCI",
          ogrenciProfil: { create: { il: o.il, ilce: o.ilce, sinif: o.sinif, okul: o.okul } },
        },
      });
      console.log(`Öğrenci oluşturuldu: ${user.telefon}`);
    }
    const profil = await prisma.ogrenciProfil.findUnique({ where: { userId: user.id } });
    ogrenciler.push({ user, profil });
  }

  // ── Veliler ───────────────────────────────────────────────────────────────
  const veliData = [
    { ad: "Hüseyin", soyad: "Çelik", telefon: "+905550000050", email: "huseyin.celik@gmail.com" },
    { ad: "Fatıma", soyad: "Kaya", telefon: "+905550000051", email: "fatima.kaya@gmail.com" },
    { ad: "Mehmet Ali", soyad: "Yıldız", telefon: "+905550000052", email: "mehmetal.yildiz@gmail.com" },
    { ad: "Zehra", soyad: "Arslan", telefon: "+905550000053", email: "zehra.arslan@gmail.com" },
  ];

  const veliler: { user: (typeof admin); profil: Awaited<ReturnType<typeof prisma.veliProfil.findUnique>> }[] = [];
  for (const v of veliData) {
    let user = await prisma.user.findUnique({ where: { telefon: v.telefon } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          ad: v.ad,
          soyad: v.soyad,
          telefon: v.telefon,
          email: v.email,
          sifreHash: testSifre,
          rol: "VELI",
          veliProfil: { create: {} },
        },
      });
      console.log(`Veli oluşturuldu: ${user.telefon}`);
    }
    const profil = await prisma.veliProfil.findUnique({ where: { userId: user.id } });
    veliler.push({ user, profil });
  }

  // Veli → Öğrenci bağlantısı
  const veliOgrenciMap = [
    { veliIdx: 0, ogrenciIdx: 0 }, // Hüseyin → Ali
    { veliIdx: 1, ogrenciIdx: 1 }, // Fatıma → Büşra
    { veliIdx: 2, ogrenciIdx: 2 }, // Mehmet Ali → Emre
    { veliIdx: 3, ogrenciIdx: 3 }, // Zehra → Naz
  ];
  for (const { veliIdx, ogrenciIdx } of veliOgrenciMap) {
    const veliProfil = veliler[veliIdx].profil;
    const ogrenciProfil = ogrenciler[ogrenciIdx].profil;
    if (veliProfil && ogrenciProfil && !ogrenciProfil.veliId) {
      await prisma.ogrenciProfil.update({
        where: { id: ogrenciProfil.id },
        data: { veliId: veliProfil.id },
      });
    }
  }

  // ── Koç–Öğrenci Eşleştirme ────────────────────────────────────────────────
  // koclar[0] Ahmet  → Ali(0), Büşra(1)
  // koclar[1] Fatma  → Emre(2), Naz(3)
  // koclar[2] Mehmet → Yusuf(4), Gamze(5)
  // koclar[3] Elif   → Ömer(6), Pınar(7)
  // koclar[4] Can    → İbrahim(8), Seda(9), testOgrenci
  const kocOgrenciMap = [
    { kocIdx: 0, ogrenciIdx: 0 }, { kocIdx: 0, ogrenciIdx: 1 },
    { kocIdx: 1, ogrenciIdx: 2 }, { kocIdx: 1, ogrenciIdx: 3 },
    { kocIdx: 2, ogrenciIdx: 4 }, { kocIdx: 2, ogrenciIdx: 5 },
    { kocIdx: 3, ogrenciIdx: 6 }, { kocIdx: 3, ogrenciIdx: 7 },
    { kocIdx: 4, ogrenciIdx: 8 }, { kocIdx: 4, ogrenciIdx: 9 },
  ];
  for (const { kocIdx, ogrenciIdx } of kocOgrenciMap) {
    const kocProfil = koclar[kocIdx].profil;
    const ogrenciProfil = ogrenciler[ogrenciIdx].profil;
    if (!kocProfil || !ogrenciProfil) continue;
    const var1 = await prisma.ogrenciKocEslestirme.findFirst({
      where: { kocId: kocProfil.id, ogrenciId: ogrenciProfil.id, aktif: true },
    });
    if (!var1) {
      await prisma.ogrenciKocEslestirme.create({
        data: { kocId: kocProfil.id, ogrenciId: ogrenciProfil.id, baslangic: new Date("2026-02-01") },
      });
    }
  }
  if (testOgrenciProfil && koclar[4].profil) {
    const var1 = await prisma.ogrenciKocEslestirme.findFirst({
      where: { kocId: koclar[4].profil.id, ogrenciId: testOgrenciProfil.id, aktif: true },
    });
    if (!var1) {
      await prisma.ogrenciKocEslestirme.create({
        data: { kocId: koclar[4].profil.id, ogrenciId: testOgrenciProfil.id, baslangic: new Date("2026-02-01") },
      });
    }
  }

  // ── Koordinatör–Öğrenci Eşleştirme ───────────────────────────────────────
  // Zeynep(0/İstanbul) → Ali(0), Büşra(1), İbrahim(8), Kerem(10), testOgrenci
  // Mustafa(1/Ankara)  → Emre(2), Naz(3), Seda(9)
  // Ayşe(2/İzmir)      → Yusuf(4), Gamze(5), Rana(11)
  const koordinatorOgrenciMap: { koordinatorIdx: number; ogrenciIdxler: number[] }[] = [
    { koordinatorIdx: 0, ogrenciIdxler: [0, 1, 8, 10] },
    { koordinatorIdx: 1, ogrenciIdxler: [2, 3, 9] },
    { koordinatorIdx: 2, ogrenciIdxler: [4, 5, 11] },
  ];
  for (const { koordinatorIdx, ogrenciIdxler } of koordinatorOgrenciMap) {
    const koordinatorProfil = koordinatorler[koordinatorIdx].profil;
    for (const ogrenciIdx of ogrenciIdxler) {
      const ogrenciProfil = ogrenciler[ogrenciIdx].profil;
      if (!koordinatorProfil || !ogrenciProfil) continue;
      const var1 = await prisma.ogrenciKoordinatorEslestirme.findFirst({
        where: { koordinatorId: koordinatorProfil.id, ogrenciId: ogrenciProfil.id, aktif: true },
      });
      if (!var1) {
        await prisma.ogrenciKoordinatorEslestirme.create({
          data: { koordinatorId: koordinatorProfil.id, ogrenciId: ogrenciProfil.id, baslangic: new Date("2026-02-01") },
        });
      }
    }
  }
  if (testOgrenciProfil && koordinatorler[0].profil) {
    const var1 = await prisma.ogrenciKoordinatorEslestirme.findFirst({
      where: { koordinatorId: koordinatorler[0].profil.id, ogrenciId: testOgrenciProfil.id, aktif: true },
    });
    if (!var1) {
      await prisma.ogrenciKoordinatorEslestirme.create({
        data: { koordinatorId: koordinatorler[0].profil.id, ogrenciId: testOgrenciProfil.id, baslangic: new Date("2026-02-01") },
      });
    }
  }

  console.log("Eşleştirmeler oluşturuldu.");

  // ── Görüşmeler ────────────────────────────────────────────────────────────
  type GorusmeDurumu = "TASLAK" | "GONDERILDI" | "ONAYLANDI" | "REDDEDILDI";
  const gorusmeData: {
    kocIdx: number; ogrenciIdx: number; tarih: string;
    konu: string; not: string; ilerlemePuani: number; durum: GorusmeDurumu;
  }[] = [
    // Ahmet – Ali
    { kocIdx: 0, ogrenciIdx: 0, tarih: "2026-05-10", konu: "Türev ve İntegral", not: "Ali türev konusunda güzel ilerleme kaydetti. Limit kavramını pekiştirmesi gerekiyor.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    { kocIdx: 0, ogrenciIdx: 0, tarih: "2026-04-25", konu: "Bileşke Fonksiyonlar", not: "Bileşke fonksiyonları tamamladık. Ev ödevi verildi.", ilerlemePuani: 6, durum: "ONAYLANDI" },
    { kocIdx: 0, ogrenciIdx: 0, tarih: "2026-04-10", konu: "Trigonometri", not: "Trigonometrik özdeşlikler üzerine çalıştık. Kavramları oturtmaya başladı.", ilerlemePuani: 5, durum: "ONAYLANDI" },
    // Ahmet – Büşra
    { kocIdx: 0, ogrenciIdx: 1, tarih: "2026-05-08", konu: "İkinci Dereceden Denklemler", not: "İkinci dereceden denklemleri rahat çözüyor. Sınava hazırlık iyi gidiyor.", ilerlemePuani: 8, durum: "ONAYLANDI" },
    { kocIdx: 0, ogrenciIdx: 1, tarih: "2026-04-22", konu: "EBOB–EKOK", not: "Sayı problemleri üzerinde çalıştık. Genel olarak başarılı.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    // Fatma – Emre
    { kocIdx: 1, ogrenciIdx: 2, tarih: "2026-05-09", konu: "Şiir Çözümleme", not: "Divan edebiyatı şiirlerini birlikte analiz ettik. Emre çok meraklı.", ilerlemePuani: 9, durum: "ONAYLANDI" },
    { kocIdx: 1, ogrenciIdx: 2, tarih: "2026-04-24", konu: "Yazma Becerisi", not: "Kompozisyon teknikleri üzerine çalıştık. İlerleme tatmin edici.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    // Fatma – Naz
    { kocIdx: 1, ogrenciIdx: 3, tarih: "2026-05-07", konu: "Paragraf Çalışması", not: "Ana fikir bulma ve destekleyici cümle tespiti alıştırmaları yaptık.", ilerlemePuani: 6, durum: "ONAYLANDI" },
    { kocIdx: 1, ogrenciIdx: 3, tarih: "2026-04-21", konu: "Noktalama İşaretleri", not: "Noktalama ve yazım kuralları üzerine detaylı çalışma yapıldı.", ilerlemePuani: 5, durum: "ONAYLANDI" },
    // Mehmet – Yusuf
    { kocIdx: 2, ogrenciIdx: 4, tarih: "2026-05-11", konu: "Kimya – Mol Hesapları", not: "Mol kavramı ve kimyasal denklemlerde mol hesapları. Kapsamlı çalışma.", ilerlemePuani: 8, durum: "ONAYLANDI" },
    { kocIdx: 2, ogrenciIdx: 4, tarih: "2026-04-27", konu: "Fizik – Kuvvet ve Hareket", not: "Newton yasaları ve uygulamaları çalışıldı. Yusuf analitik düşünüyor.", ilerlemePuani: 9, durum: "ONAYLANDI" },
    { kocIdx: 2, ogrenciIdx: 4, tarih: "2026-04-12", konu: "Biyoloji – Hücre Organelleri", not: "Hücre organelleri ve görevleri tekrar edildi. Başarılı bir ders.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    // Mehmet – Gamze
    { kocIdx: 2, ogrenciIdx: 5, tarih: "2026-05-06", konu: "Kimya – Atom Modelleri", not: "Periyodik tablo ve atom modelleri üzerine çalışıldı. Anlama sürecinde.", ilerlemePuani: 5, durum: "ONAYLANDI" },
    { kocIdx: 2, ogrenciIdx: 5, tarih: "2026-04-19", konu: "Biyoloji – Fotosentez", not: "Fotosentez ve solunum reaksiyonları işlendi. Görsel materyaller faydalı oldu.", ilerlemePuani: 6, durum: "ONAYLANDI" },
    // Elif – Ömer
    { kocIdx: 3, ogrenciIdx: 6, tarih: "2026-05-12", konu: "Tarih – Osmanlı Kuruluş Dönemi", not: "Osmanlı Devleti'nin kuruluş dönemini inceledik. Ömer tarihe çok ilgili.", ilerlemePuani: 8, durum: "GONDERILDI" },
    { kocIdx: 3, ogrenciIdx: 6, tarih: "2026-04-28", konu: "Coğrafya – İklim Bölgeleri", not: "Türkiye'nin iklim bölgeleri ve özellikleri çalışıldı.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    // Elif – Pınar
    { kocIdx: 3, ogrenciIdx: 7, tarih: "2026-05-05", konu: "Felsefe – Mantık", not: "Tümdengelim ve tümevarım yöntemleri üzerine tartışma yapıldı.", ilerlemePuani: 6, durum: "ONAYLANDI" },
    { kocIdx: 3, ogrenciIdx: 7, tarih: "2026-04-18", konu: "Tarih – Kurtuluş Savaşı", not: "İstiklal Harbi'nin aşamaları ve önemli şahsiyetler ele alındı.", ilerlemePuani: 8, durum: "ONAYLANDI" },
    // Can – İbrahim
    { kocIdx: 4, ogrenciIdx: 8, tarih: "2026-05-13", konu: "Essay Writing", not: "Analytical essay yazma teknikleri üzerine çalışıldı. İbrahim seviyesi yüksek.", ilerlemePuani: 9, durum: "GONDERILDI" },
    { kocIdx: 4, ogrenciIdx: 8, tarih: "2026-04-29", konu: "Reading Comprehension", not: "Akademik okuma parçaları çalışıldı. Kelime bilgisi gelişiyor.", ilerlemePuani: 8, durum: "ONAYLANDI" },
    { kocIdx: 4, ogrenciIdx: 8, tarih: "2026-04-14", konu: "Listening & Speaking", not: "Podcast dinleme ve tartışma etkinliği yapıldı. Akıcılık arttı.", ilerlemePuani: 7, durum: "ONAYLANDI" },
    // Can – Seda
    { kocIdx: 4, ogrenciIdx: 9, tarih: "2026-05-04", konu: "Grammar – Perfect Tenses", not: "Present perfect ve past perfect tense çalışıldı. Tekrar gerektiriyor.", ilerlemePuani: 5, durum: "ONAYLANDI" },
    { kocIdx: 4, ogrenciIdx: 9, tarih: "2026-04-20", konu: "Vocabulary Building", not: "Akademik kelime listesi üzerinde çalışıldı. Kelime kartları hazırlandı.", ilerlemePuani: 6, durum: "ONAYLANDI" },
  ];

  for (const g of gorusmeData) {
    const kocProfil = koclar[g.kocIdx].profil;
    const ogrenciProfil = ogrenciler[g.ogrenciIdx].profil;
    if (!kocProfil || !ogrenciProfil) continue;
    const tarih = new Date(g.tarih);
    const var1 = await prisma.gorusme.findFirst({
      where: { kocId: kocProfil.id, ogrenciId: ogrenciProfil.id, tarih },
    });
    if (!var1) {
      await prisma.gorusme.create({
        data: {
          kocId: kocProfil.id,
          ogrenciId: ogrenciProfil.id,
          tarih,
          konu: g.konu,
          not: g.not,
          ilerlemePuani: g.ilerlemePuani,
          durum: g.durum,
          onaylayanId: g.durum === "ONAYLANDI" ? admin.id : undefined,
          onayTarihi: g.durum === "ONAYLANDI" ? new Date(g.tarih + "T12:00:00Z") : undefined,
        },
      });
    }
  }
  console.log("Görüşmeler oluşturuldu.");

  // ── Mesajlar ──────────────────────────────────────────────────────────────
  const mesajData = [
    // Ahmet ↔ Ali
    { gonderici: koclar[0].user, alici: ogrenciler[0].user, icerik: "Merhaba Ali, bu hafta türev konusunda güzel bir ilerleme kaydettin. Ders notlarını tekrar etmeyi unutma.", tarih: "2026-05-10T14:00:00Z" },
    { gonderici: ogrenciler[0].user, alici: koclar[0].user, icerik: "Teşekkürler hocam! Çalışmaya devam ediyorum. Limit ile türev arasındaki farkı tam kavrayamadım, biraz açıklar mısınız?", tarih: "2026-05-10T18:30:00Z" },
    { gonderici: koclar[0].user, alici: ogrenciler[0].user, icerik: "Harika soru! Bir sonraki dersimizde bunu detaylıca açıklayacağız. O güne kadar kitabın 4. bölümüne bak.", tarih: "2026-05-10T19:00:00Z" },
    // Admin ↔ Zeynep
    { gonderici: admin, alici: koordinatorler[0].user, icerik: "Zeynep Hanım, İstanbul bölgesindeki öğrenci raporlarını inceledim. Genel olarak iyi gidiyor.", tarih: "2026-05-09T10:00:00Z" },
    { gonderici: koordinatorler[0].user, alici: admin, icerik: "Evet, öğrencilerimiz bu ay çok daha aktif. Can Koç'un çalışmaları özellikle dikkat çekici.", tarih: "2026-05-09T10:30:00Z" },
    { gonderici: admin, alici: koordinatorler[0].user, icerik: "Kerem ve Öğrenci için koç ataması gerekiyor. Yeni gelen Merve Doğan havuzda, uygun olabilir.", tarih: "2026-05-09T11:00:00Z" },
    // Fatma ↔ Emre
    { gonderici: koclar[1].user, alici: ogrenciler[2].user, icerik: "Emre, geçen derste yazdığın deneme gerçekten etkileyiciydi. Yarınki derse hazır mısın?", tarih: "2026-05-08T16:00:00Z" },
    { gonderici: ogrenciler[2].user, alici: koclar[1].user, icerik: "Evet hocam! Ödev olarak verdiğiniz hikayeyi de okudum, çok güzeldi.", tarih: "2026-05-08T17:45:00Z" },
    // Can ↔ İbrahim
    { gonderici: koclar[4].user, alici: ogrenciler[8].user, icerik: "İbrahim, essay'in structure açısından çok güçlüydü. Body paragraphlarını biraz daha geliştirirsen mükemmel olacak.", tarih: "2026-05-13T15:00:00Z" },
    { gonderici: ogrenciler[8].user, alici: koclar[4].user, icerik: "Teşekkürler! Counterargument bölümünü nasıl güçlendirebilirim peki?", tarih: "2026-05-13T16:20:00Z" },
    { gonderici: koclar[4].user, alici: ogrenciler[8].user, icerik: "Concession cümleleri kullan — 'Although...', 'While it is true that...' gibi. Bir sonraki derste örneklendireceğiz.", tarih: "2026-05-13T16:45:00Z" },
  ];

  for (const m of mesajData) {
    if (!m.gonderici || !m.alici) continue;
    await prisma.mesaj.create({
      data: {
        gondericiId: m.gonderici.id,
        aliciId: m.alici.id,
        icerik: m.icerik,
        tarih: new Date(m.tarih),
        okundu: true,
      },
    });
  }
  console.log("Mesajlar oluşturuldu.");

  // ── Başvurular ────────────────────────────────────────────────────────────
  const ogrenciBasvurular = [
    { ad: "Bora", soyad: "Kılınç", telefon: "+905559990001", dogumTarihi: "2009-03-12", il: "İstanbul", ilce: "Pendik", sinif: "9. Sınıf", okul: "Pendik Anadolu Lisesi", veliAd: "Kadir", veliSoyad: "Kılınç", veliTelefon: "+905559990002" },
    { ad: "Defne", soyad: "Öztürk", telefon: "+905559990003", dogumTarihi: "2008-07-19", il: "Ankara", ilce: "Yenimahalle", sinif: "10. Sınıf", okul: "Yenimahalle Lisesi", veliAd: "Sevgi", veliSoyad: "Öztürk", veliTelefon: "+905559990004" },
    { ad: "Kaan", soyad: "Erdoğan", telefon: "+905559990005", dogumTarihi: "2009-11-25", il: "İzmir", ilce: "Buca", sinif: "9. Sınıf", okul: "Buca Lisesi" },
  ];
  for (const b of ogrenciBasvurular) {
    const var1 = await prisma.ogrenciKayitBasvuru.findFirst({ where: { telefon: b.telefon } });
    if (!var1) {
      await prisma.ogrenciKayitBasvuru.create({
        data: {
          ad: b.ad, soyad: b.soyad, telefon: b.telefon,
          dogumTarihi: new Date(b.dogumTarihi),
          il: b.il, ilce: b.ilce, sinif: b.sinif, okul: b.okul,
          veliAd: b.veliAd, veliSoyad: b.veliSoyad, veliTelefon: b.veliTelefon,
          durum: "BEKLEMEDE",
        },
      });
    }
  }

  const kocBasvurular = [
    { ad: "Tuba", soyad: "Çakır", telefon: "+905559990010", dogumTarihi: "1992-04-05", uzmanlik: "Fizik", notlar: "Marmara Üniversitesi Fizik Bölümü mezunuyum. 3 yıl özel ders deneyimim var." },
    { ad: "Serkan", soyad: "Bayrak", telefon: "+905559990011", dogumTarihi: "1989-08-15", uzmanlik: "Tarih", notlar: "Hacettepe Üniversitesi Tarih Bölümü mezunuyum. Lise öğrencilerine koçluk yapıyorum." },
  ];
  for (const b of kocBasvurular) {
    const var1 = await prisma.kocOnBasvuru.findFirst({ where: { telefon: b.telefon } });
    if (!var1) {
      await prisma.kocOnBasvuru.create({
        data: {
          ad: b.ad, soyad: b.soyad, telefon: b.telefon,
          dogumTarihi: new Date(b.dogumTarihi),
          uzmanlik: b.uzmanlik, notlar: b.notlar,
          durum: "BEKLEMEDE",
        },
      });
    }
  }
  console.log("Başvurular oluşturuldu.");

  // ── Bildirimler ───────────────────────────────────────────────────────────
  const bildirimler = [
    { kullanici: admin, tip: "YENI_BASVURU" as const, baslik: "Yeni Öğrenci Başvurusu", icerik: "Bora Kılınç sisteme kayıt başvurusu yaptı.", link: "/admin/basvurular/ogrenci" },
    { kullanici: admin, tip: "YENI_BASVURU" as const, baslik: "Yeni Koç Başvurusu", icerik: "Tuba Çakır koç ön başvurusu gönderdi.", link: "/admin/basvurular/koc" },
    { kullanici: koclar[0].user, tip: "GORUSME_ONAYLANDI" as const, baslik: "Görüşme Onaylandı", icerik: "10 Mayıs tarihli Ali Çelik görüşmeniz onaylandı.", link: "/koc/gorusmeler" },
    { kullanici: koclar[4].user, tip: "ESLESTIRME" as const, baslik: "Yeni Öğrenci Eşleşmesi", icerik: "Test Öğrenci sizinle eşleştirildi.", link: "/koc/gorusmeler" },
    { kullanici: ogrenciler[0].user, tip: "GORUSME_ONAYLANDI" as const, baslik: "Görüşme Onaylandı", icerik: "10 Mayıs tarihli görüşmeniz onaylandı.", link: "/ogrenci/gorusmelerim" },
    { kullanici: koordinatorler[0].user, tip: "ESLESTIRME" as const, baslik: "Yeni Öğrenci", icerik: "Test Öğrenci bölgenize atandı.", link: "/koordinator" },
  ];
  for (const b of bildirimler) {
    if (!b.kullanici) continue;
    await prisma.bildirim.create({
      data: {
        kullaniciId: b.kullanici.id,
        tip: b.tip,
        baslik: b.baslik,
        icerik: b.icerik,
        link: b.link,
        okundu: false,
      },
    });
  }
  console.log("Bildirimler oluşturuldu.");

  // ── Ayarlar ───────────────────────────────────────────────────────────────
  await prisma.ayar.upsert({
    where: { anahtar: "gorusme_periyodu_gun" },
    update: {},
    create: {
      anahtar: "gorusme_periyodu_gun",
      deger: String(process.env.DEFAULT_GORUSME_PERIYODU_GUN ?? 14),
      aciklama: "Bir koçun en geç bu kadar gün içinde görüşme yapması beklenir.",
    },
  });

  console.log("\n✓ Seed tamamlandı!");
  console.log("──────────────────────────────────────────");
  console.log("Admin     : +905555555555 / Admin1234!");
  console.log("Koç/Koord : +90555000001x / Test1234!");
  console.log("Öğrenci   : +905550000001 / doğum: 2010-01-15");
  console.log("──────────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
