import Link from "next/link";
import { KocBasvuruForm } from "./koc-form";

export default function KocBasvuruSayfasi() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Koç Ön Başvuru</h1>
      <p className="mt-1 text-sm text-slate-600">
        KARE Eğitim&apos;de gönüllü koç olarak görev almak için bu formu doldurun.
        Koordinatörlerimiz başvurunuzu değerlendirip size SMS ile dönüş yapacak.
      </p>
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <KocBasvuruForm />
      </div>
    </main>
  );
}
