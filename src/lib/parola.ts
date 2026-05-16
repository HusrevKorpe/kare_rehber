import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

// Karışıklığa yol açan karakterler (0/O, 1/l/I) çıkarıldı.
const HARFLER = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const RAKAMLAR = "23456789";

export function rastgeleParola(uzunluk = 8): string {
  const havuz = HARFLER + RAKAMLAR;
  const harfler: string[] = [];
  // En az bir harf, bir rakam garantisi
  harfler.push(HARFLER[randomInt(0, HARFLER.length)]);
  harfler.push(RAKAMLAR[randomInt(0, RAKAMLAR.length)]);
  for (let i = harfler.length; i < uzunluk; i++) {
    harfler.push(havuz[randomInt(0, havuz.length)]);
  }
  // Karıştır
  for (let i = harfler.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [harfler[i], harfler[j]] = [harfler[j], harfler[i]];
  }
  return harfler.join("");
}

export function hashParola(parola: string): Promise<string> {
  return bcrypt.hash(parola, 10);
}

export function dogrulaParola(parola: string, hash: string): Promise<boolean> {
  return bcrypt.compare(parola, hash);
}
