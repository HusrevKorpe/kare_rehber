"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";
import { ROL_PANELLERI } from "@/lib/permissions";
import { normalizeTel } from "@/lib/phone";
import { sistemLogYaz } from "@/server/log";

export type GirisDurumu = { hata?: string };

export async function girisYap(
  _onceki: GirisDurumu,
  formData: FormData,
): Promise<GirisDurumu> {
  const telHam = String(formData.get("telefon") ?? "").trim();
  const parola = String(formData.get("parola") ?? "");
  const dogumTarihi = String(formData.get("dogumTarihi") ?? "");

  const telefon = normalizeTel(telHam);
  if (!telefon) return { hata: "Telefon numarası geçerli değil." };
  if (!parola && !dogumTarihi) return { hata: "Parola veya doğum tarihi gerekli." };

  try {
    await signIn("credentials", { telefon, parola, dogumTarihi, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { hata: "Telefon veya parola hatalı." };
    }
    throw err;
  }

  const session = await auth();
  if (!session?.user) return { hata: "Oturum başlatılamadı." };

  await sistemLogYaz({
    actorId: session.user.id,
    action: "giris",
    target: session.user.id,
  });

  redirect(ROL_PANELLERI[session.user.rol]);
}

export async function cikisYap() {
  const session = await auth();
  if (session?.user) {
    await sistemLogYaz({
      actorId: session.user.id,
      action: "cikis",
      target: session.user.id,
    });
  }
  await signOut({ redirect: false });
  redirect("/giris");
}
