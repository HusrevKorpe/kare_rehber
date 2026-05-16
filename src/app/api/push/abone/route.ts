import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Govde = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const govde = (await req.json().catch(() => null)) as Govde | null;

  if (!govde?.endpoint || !govde.keys?.p256dh || !govde.keys?.auth) {
    return NextResponse.json(
      { ok: false, hata: "Geçersiz abonelik verisi." },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  await prisma.pushAbonelik.upsert({
    where: { endpoint: govde.endpoint },
    create: {
      kullaniciId: session.user.id,
      endpoint: govde.endpoint,
      p256dh: govde.keys.p256dh,
      auth: govde.keys.auth,
      userAgent,
    },
    update: {
      kullaniciId: session.user.id,
      p256dh: govde.keys.p256dh,
      auth: govde.keys.auth,
      sonKullanim: new Date(),
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await requireSession();
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ ok: false, hata: "endpoint gerekli." }, { status: 400 });
  }
  await prisma.pushAbonelik.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
