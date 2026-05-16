-- CreateEnum
CREATE TYPE "BildirimTipi" AS ENUM ('MESAJ', 'GORUSME_GONDERILDI', 'GORUSME_ONAYLANDI', 'GORUSME_REDDEDILDI', 'ESLESTIRME', 'BASVURU_ONAYLANDI', 'BASVURU_REDDEDILDI', 'YENI_BASVURU', 'GECIKEN_GORUSME', 'SISTEM');

-- CreateTable
CREATE TABLE "Bildirim" (
    "id" TEXT NOT NULL,
    "kullaniciId" TEXT NOT NULL,
    "tip" "BildirimTipi" NOT NULL,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "link" TEXT,
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "okunmaTarihi" TIMESTAMP(3),
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bildirim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bildirim_kullaniciId_okundu_idx" ON "Bildirim"("kullaniciId", "okundu");

-- CreateIndex
CREATE INDEX "Bildirim_kullaniciId_tarih_idx" ON "Bildirim"("kullaniciId", "tarih");

-- AddForeignKey
ALTER TABLE "Bildirim" ADD CONSTRAINT "Bildirim_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
