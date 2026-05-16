import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Rol } from "@/generated/prisma/enums";

const girisSemasi = z.object({
  telefon: z.string().min(3),
  parola: z.string().optional(),
  dogumTarihi: z.string().optional(),
});

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        telefon: { label: "Telefon" },
        parola: { label: "Parola", type: "password" },
        dogumTarihi: { label: "Doğum Tarihi" },
      },
      async authorize(raw) {
        const parsed = girisSemasi.safeParse(raw);
        if (!parsed.success) return null;
        const { telefon, parola, dogumTarihi } = parsed.data;

        const kullanici = await prisma.user.findUnique({
          where: { telefon },
        });
        if (!kullanici || !kullanici.aktif) return null;

        if (kullanici.sifreHash) {
          if (!parola) return null;
          const dogru = await bcrypt.compare(parola, kullanici.sifreHash);
          if (!dogru) return null;
        } else if (kullanici.dogumTarihi) {
          if (!dogumTarihi) return null;
          const girilen = new Date(dogumTarihi);
          const kayitli = kullanici.dogumTarihi;
          if (
            girilen.getFullYear() !== kayitli.getFullYear() ||
            girilen.getMonth() !== kayitli.getMonth() ||
            girilen.getDate() !== kayitli.getDate()
          ) return null;
        } else {
          return null;
        }

        return {
          id: kullanici.id,
          name: `${kullanici.ad} ${kullanici.soyad}`,
          email: kullanici.email ?? undefined,
          rol: kullanici.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as { rol: Rol }).rol;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.uid as string;
        session.user.rol = token.rol as Rol;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const acik = ["/", "/giris", "/ogrenci-kayit-formu", "/koc-on-basvuru"];
      const acikPrefix = ["/api/auth"];
      if (acik.includes(pathname)) return true;
      if (acikPrefix.some((p) => pathname.startsWith(p))) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
