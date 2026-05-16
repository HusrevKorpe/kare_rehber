import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Rol } from "@/generated/prisma/enums";
import { ROL_PANELLERI } from "@/lib/permissions";

export async function getSession() {
  return auth();
}

export async function getUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/giris");
  return session;
}

export async function requireRole(...izinli: Rol[]) {
  const session = await requireSession();
  const rol = session.user.rol;
  if (!izinli.includes(rol)) {
    // Yetkisiz: kullanıcının kendi paneline yönlendir.
    redirect(ROL_PANELLERI[rol]);
  }
  return session;
}
