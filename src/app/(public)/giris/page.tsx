import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROL_PANELLERI } from "@/lib/permissions";
import { GirisForm } from "./giris-form";

export default async function GirisSayfasi() {
  const session = await auth();
  if (session?.user) {
    redirect(ROL_PANELLERI[session.user.rol]);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Giriş</h1>
        <p className="mt-1 text-sm text-slate-600">
          Telefon numaranız ve parolanız ile giriş yapın. Parolanız size SMS ile
          gönderilmiştir.
        </p>

        <div className="mt-6">
          <GirisForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hesabınız yok mu?{" "}
          <Link className="underline" href="/ogrenci-kayit-formu">
            Öğrenci kaydı
          </Link>
          {" / "}
          <Link className="underline" href="/koc-on-basvuru">
            Koç başvurusu
          </Link>
        </p>
      </div>
    </main>
  );
}
