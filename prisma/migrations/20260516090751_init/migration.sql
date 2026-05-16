-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'KOORDINATOR', 'KOC', 'OGRENCI', 'VELI');

-- CreateEnum
CREATE TYPE "KocDurumu" AS ENUM ('HAVUZ', 'AKTIF', 'PASIF');

-- CreateEnum
CREATE TYPE "BasvuruDurumu" AS ENUM ('BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI');

-- CreateEnum
CREATE TYPE "GorusmeDurumu" AS ENUM ('TASLAK', 'GONDERILDI', 'ONAYLANDI', 'REDDEDILDI');

-- CreateEnum
CREATE TYPE "SmsDurumu" AS ENUM ('GONDERILDI', 'BASARISIZ', 'BEKLEMEDE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "dogumTarihi" TIMESTAMP(3),
    "email" TEXT,
    "sifreHash" TEXT,
    "rol" "Rol" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgrenciProfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "il" TEXT NOT NULL,
    "ilce" TEXT,
    "sinif" TEXT,
    "okul" TEXT,
    "veliId" TEXT,

    CONSTRAINT "OgrenciProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KocProfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uzmanlik" TEXT,
    "durum" "KocDurumu" NOT NULL DEFAULT 'HAVUZ',

    CONSTRAINT "KocProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KoordinatorProfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vakifAdi" TEXT NOT NULL,
    "il" TEXT,

    CONSTRAINT "KoordinatorProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeliProfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VeliProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgrenciKayitBasvuru" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "dogumTarihi" TIMESTAMP(3),
    "email" TEXT,
    "il" TEXT NOT NULL,
    "ilce" TEXT,
    "sinif" TEXT,
    "okul" TEXT,
    "veliAd" TEXT,
    "veliSoyad" TEXT,
    "veliTelefon" TEXT,
    "notlar" TEXT,
    "durum" "BasvuruDurumu" NOT NULL DEFAULT 'BEKLEMEDE',
    "incelemeTarihi" TIMESTAMP(3),
    "inceleyenId" TEXT,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OgrenciKayitBasvuru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KocOnBasvuru" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "dogumTarihi" TIMESTAMP(3),
    "email" TEXT,
    "uzmanlik" TEXT,
    "notlar" TEXT,
    "durum" "BasvuruDurumu" NOT NULL DEFAULT 'BEKLEMEDE',
    "incelemeTarihi" TIMESTAMP(3),
    "inceleyenId" TEXT,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KocOnBasvuru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgrenciKocEslestirme" (
    "id" TEXT NOT NULL,
    "ogrenciId" TEXT NOT NULL,
    "kocId" TEXT NOT NULL,
    "baslangic" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitis" TIMESTAMP(3),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OgrenciKocEslestirme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OgrenciKoordinatorEslestirme" (
    "id" TEXT NOT NULL,
    "ogrenciId" TEXT NOT NULL,
    "koordinatorId" TEXT NOT NULL,
    "baslangic" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OgrenciKoordinatorEslestirme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gorusme" (
    "id" TEXT NOT NULL,
    "kocId" TEXT NOT NULL,
    "ogrenciId" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "konu" TEXT,
    "not" TEXT NOT NULL,
    "ilerlemePuani" INTEGER,
    "durum" "GorusmeDurumu" NOT NULL DEFAULT 'GONDERILDI',
    "onaylayanId" TEXT,
    "onayTarihi" TIMESTAMP(3),
    "redSebebi" TEXT,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gorusme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorusmeLog" (
    "id" TEXT NOT NULL,
    "gorusmeId" TEXT NOT NULL,
    "degistirenId" TEXT NOT NULL,
    "eskiVeri" JSONB,
    "yeniVeri" JSONB,
    "aciklama" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GorusmeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mesaj" (
    "id" TEXT NOT NULL,
    "gondericiId" TEXT NOT NULL,
    "aliciId" TEXT NOT NULL,
    "konu" TEXT,
    "icerik" TEXT NOT NULL,
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "okunmaTarihi" TIMESTAMP(3),
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mesaj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "aliciTel" TEXT NOT NULL,
    "aliciUserId" TEXT,
    "icerik" TEXT NOT NULL,
    "durum" "SmsDurumu" NOT NULL DEFAULT 'BEKLEMEDE',
    "saglayici" TEXT NOT NULL,
    "saglayiciYanit" TEXT,
    "hataMesaji" TEXT,
    "gonderenId" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SistemLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SistemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ayar" (
    "anahtar" TEXT NOT NULL,
    "deger" TEXT NOT NULL,
    "aciklama" TEXT,
    "guncellenme" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ayar_pkey" PRIMARY KEY ("anahtar")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telefon_key" ON "User"("telefon");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE INDEX "User_telefon_idx" ON "User"("telefon");

-- CreateIndex
CREATE UNIQUE INDEX "OgrenciProfil_userId_key" ON "OgrenciProfil"("userId");

-- CreateIndex
CREATE INDEX "OgrenciProfil_il_idx" ON "OgrenciProfil"("il");

-- CreateIndex
CREATE INDEX "OgrenciProfil_veliId_idx" ON "OgrenciProfil"("veliId");

-- CreateIndex
CREATE UNIQUE INDEX "KocProfil_userId_key" ON "KocProfil"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KoordinatorProfil_userId_key" ON "KoordinatorProfil"("userId");

-- CreateIndex
CREATE INDEX "KoordinatorProfil_il_idx" ON "KoordinatorProfil"("il");

-- CreateIndex
CREATE UNIQUE INDEX "VeliProfil_userId_key" ON "VeliProfil"("userId");

-- CreateIndex
CREATE INDEX "OgrenciKayitBasvuru_durum_idx" ON "OgrenciKayitBasvuru"("durum");

-- CreateIndex
CREATE INDEX "OgrenciKayitBasvuru_il_idx" ON "OgrenciKayitBasvuru"("il");

-- CreateIndex
CREATE INDEX "KocOnBasvuru_durum_idx" ON "KocOnBasvuru"("durum");

-- CreateIndex
CREATE INDEX "OgrenciKocEslestirme_aktif_idx" ON "OgrenciKocEslestirme"("aktif");

-- CreateIndex
CREATE UNIQUE INDEX "OgrenciKocEslestirme_ogrenciId_kocId_aktif_key" ON "OgrenciKocEslestirme"("ogrenciId", "kocId", "aktif");

-- CreateIndex
CREATE INDEX "OgrenciKoordinatorEslestirme_aktif_idx" ON "OgrenciKoordinatorEslestirme"("aktif");

-- CreateIndex
CREATE UNIQUE INDEX "OgrenciKoordinatorEslestirme_ogrenciId_koordinatorId_aktif_key" ON "OgrenciKoordinatorEslestirme"("ogrenciId", "koordinatorId", "aktif");

-- CreateIndex
CREATE INDEX "Gorusme_kocId_idx" ON "Gorusme"("kocId");

-- CreateIndex
CREATE INDEX "Gorusme_ogrenciId_idx" ON "Gorusme"("ogrenciId");

-- CreateIndex
CREATE INDEX "Gorusme_durum_idx" ON "Gorusme"("durum");

-- CreateIndex
CREATE INDEX "Gorusme_tarih_idx" ON "Gorusme"("tarih");

-- CreateIndex
CREATE INDEX "GorusmeLog_gorusmeId_idx" ON "GorusmeLog"("gorusmeId");

-- CreateIndex
CREATE INDEX "Mesaj_gondericiId_idx" ON "Mesaj"("gondericiId");

-- CreateIndex
CREATE INDEX "Mesaj_aliciId_idx" ON "Mesaj"("aliciId");

-- CreateIndex
CREATE INDEX "Mesaj_okundu_idx" ON "Mesaj"("okundu");

-- CreateIndex
CREATE INDEX "SmsLog_aliciTel_idx" ON "SmsLog"("aliciTel");

-- CreateIndex
CREATE INDEX "SmsLog_durum_idx" ON "SmsLog"("durum");

-- CreateIndex
CREATE INDEX "SmsLog_tarih_idx" ON "SmsLog"("tarih");

-- CreateIndex
CREATE INDEX "SistemLog_action_idx" ON "SistemLog"("action");

-- CreateIndex
CREATE INDEX "SistemLog_actorId_idx" ON "SistemLog"("actorId");

-- CreateIndex
CREATE INDEX "SistemLog_tarih_idx" ON "SistemLog"("tarih");

-- AddForeignKey
ALTER TABLE "OgrenciProfil" ADD CONSTRAINT "OgrenciProfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgrenciProfil" ADD CONSTRAINT "OgrenciProfil_veliId_fkey" FOREIGN KEY ("veliId") REFERENCES "VeliProfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KocProfil" ADD CONSTRAINT "KocProfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KoordinatorProfil" ADD CONSTRAINT "KoordinatorProfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeliProfil" ADD CONSTRAINT "VeliProfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgrenciKocEslestirme" ADD CONSTRAINT "OgrenciKocEslestirme_ogrenciId_fkey" FOREIGN KEY ("ogrenciId") REFERENCES "OgrenciProfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgrenciKocEslestirme" ADD CONSTRAINT "OgrenciKocEslestirme_kocId_fkey" FOREIGN KEY ("kocId") REFERENCES "KocProfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgrenciKoordinatorEslestirme" ADD CONSTRAINT "OgrenciKoordinatorEslestirme_ogrenciId_fkey" FOREIGN KEY ("ogrenciId") REFERENCES "OgrenciProfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OgrenciKoordinatorEslestirme" ADD CONSTRAINT "OgrenciKoordinatorEslestirme_koordinatorId_fkey" FOREIGN KEY ("koordinatorId") REFERENCES "KoordinatorProfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_kocId_fkey" FOREIGN KEY ("kocId") REFERENCES "KocProfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_ogrenciId_fkey" FOREIGN KEY ("ogrenciId") REFERENCES "OgrenciProfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorusmeLog" ADD CONSTRAINT "GorusmeLog_gorusmeId_fkey" FOREIGN KEY ("gorusmeId") REFERENCES "Gorusme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorusmeLog" ADD CONSTRAINT "GorusmeLog_degistirenId_fkey" FOREIGN KEY ("degistirenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesaj" ADD CONSTRAINT "Mesaj_gondericiId_fkey" FOREIGN KEY ("gondericiId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesaj" ADD CONSTRAINT "Mesaj_aliciId_fkey" FOREIGN KEY ("aliciId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_gonderenId_fkey" FOREIGN KEY ("gonderenId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SistemLog" ADD CONSTRAINT "SistemLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
