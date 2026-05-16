import Link from "next/link";
import { OgrenciBasvuruForm } from "./ogrenci-form";

export default function OgrenciKayitSayfasi() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Öğrenci Ön Kayıt</h1>
      <p className="mt-1 text-sm text-slate-600">
        Bu form ile başvurunuzu iletebilirsiniz. Yöneticilerimiz onay verdiğinde
        size SMS ile giriş bilgileriniz gönderilecektir.
      </p>
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <OgrenciBasvuruForm />
      </div>
    </main>
  );
}
