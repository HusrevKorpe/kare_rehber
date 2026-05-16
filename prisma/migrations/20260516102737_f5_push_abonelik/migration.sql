-- CreateTable
CREATE TABLE "PushAbonelik" (
    "id" TEXT NOT NULL,
    "kullaniciId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "olusturulma" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sonKullanim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushAbonelik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushAbonelik_endpoint_key" ON "PushAbonelik"("endpoint");

-- CreateIndex
CREATE INDEX "PushAbonelik_kullaniciId_idx" ON "PushAbonelik"("kullaniciId");

-- AddForeignKey
ALTER TABLE "PushAbonelik" ADD CONSTRAINT "PushAbonelik_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
