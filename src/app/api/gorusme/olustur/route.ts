import { NextRequest, NextResponse } from "next/server";
import { gorusmeOlustur } from "@/server/gorusme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const govde = await req.json().catch(() => null);
  if (!govde || typeof govde !== "object") {
    return NextResponse.json(
      { ok: false, hata: "Geçersiz istek." },
      { status: 400 },
    );
  }
  const sonuc = await gorusmeOlustur({
    ogrenciUserId: String(govde.ogrenciUserId ?? ""),
    tarih: String(govde.tarih ?? ""),
    konu:
      typeof govde.konu === "string" && govde.konu.length > 0
        ? govde.konu
        : undefined,
    not: String(govde.not ?? ""),
    ilerlemePuani:
      typeof govde.ilerlemePuani === "string" && govde.ilerlemePuani.length > 0
        ? govde.ilerlemePuani
        : undefined,
  });
  if (!sonuc.ok) {
    return NextResponse.json(sonuc, { status: 400 });
  }
  return NextResponse.json(sonuc, { status: 201 });
}
