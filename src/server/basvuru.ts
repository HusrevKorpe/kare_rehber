"use server";

import { prisma } from "@/lib/db";
import { normalizeTel } from "@/lib/phone";
import {
  kocBasvuruSemasi,
  ogrenciBasvuruSemasi,
  type KocBasvuruGirdi,
  type OgrenciBasvuruGirdi,
} from "@/lib/validation/basvuru";
import { sistemLogYaz } from "@/server/log";
import { rolBazliBildirim } from "@/server/bildirim";

export type BasvuruSonuc =
  | { ok: true; id: string }
  | { ok: false; hata: string; alanHatalari?: Record<string, string> };

function alanHatalariCikar(err: import("zod").ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const yol = issue.path.join(".") || "_";
    if (!out[yol]) out[yol] = issue.message;
  }
  return out;
}

function temizYazi(v: string | undefined | null) {
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}

function tarihParse(v: string | undefined | null): Date | undefined {
  const t = temizYazi(v);
  return t ? new Date(t) : undefined;
}

function telOrUndefined(v: string | undefined | null) {
  const t = temizYazi(v);
  return t ? (normalizeTel(t) ?? undefined) : undefined;
}

export async function ogrenciBasvuruGonder(
  girdi: OgrenciBasvuruGirdi,
): Promise<BasvuruSonuc> {
  const parsed = ogrenciBasvuruSemasi.safeParse(girdi);
  if (!parsed.success) {
    return {
      ok: false,
      hata: "Formda hatalı alanlar var.",
      alanHatalari: alanHatalariCikar(parsed.error),
    };
  }
  const v = parsed.data;
  const telefon = normalizeTel(v.telefon)!;

  const basvuru = await prisma.ogrenciKayitBasvuru.create({
    data: {
      ad: v.ad.trim(),
      soyad: v.soyad.trim(),
      telefon,
      dogumTarihi: tarihParse(v.dogumTarihi),
      email: temizYazi(v.email),
      il: v.il.trim(),
      ilce: temizYazi(v.ilce),
      sinif: temizYazi(v.sinif),
      okul: temizYazi(v.okul),
      veliAd: temizYazi(v.veliAd),
      veliSoyad: temizYazi(v.veliSoyad),
      veliTelefon: telOrUndefined(v.veliTelefon),
      notlar: temizYazi(v.notlar),
    },
    select: { id: true },
  });

  await sistemLogYaz({
    action: "ogrenci_basvuru_olustur",
    target: basvuru.id,
    payload: { telefon, il: v.il },
  });

  await rolBazliBildirim(["ADMIN"], {
    tip: "YENI_BASVURU",
    baslik: "Yeni öğrenci başvurusu",
    icerik: `${v.ad} ${v.soyad} — ${v.il}`,
    link: "/admin/basvurular/ogrenci",
  });

  return { ok: true, id: basvuru.id };
}

export async function kocBasvuruGonder(
  girdi: KocBasvuruGirdi,
): Promise<BasvuruSonuc> {
  const parsed = kocBasvuruSemasi.safeParse(girdi);
  if (!parsed.success) {
    return {
      ok: false,
      hata: "Formda hatalı alanlar var.",
      alanHatalari: alanHatalariCikar(parsed.error),
    };
  }
  const v = parsed.data;
  const telefon = normalizeTel(v.telefon)!;

  const basvuru = await prisma.kocOnBasvuru.create({
    data: {
      ad: v.ad.trim(),
      soyad: v.soyad.trim(),
      telefon,
      dogumTarihi: tarihParse(v.dogumTarihi),
      email: temizYazi(v.email),
      uzmanlik: temizYazi(v.uzmanlik),
      notlar: temizYazi(v.notlar),
    },
    select: { id: true },
  });

  await sistemLogYaz({
    action: "koc_basvuru_olustur",
    target: basvuru.id,
    payload: { telefon },
  });

  await rolBazliBildirim(["ADMIN"], {
    tip: "YENI_BASVURU",
    baslik: "Yeni koç ön başvurusu",
    icerik: `${v.ad} ${v.soyad}`,
    link: "/admin/basvurular/koc",
  });

  return { ok: true, id: basvuru.id };
}
