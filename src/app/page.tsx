import Link from "next/link";

const ozellikler = [
  {
    baslik: "Koç-Öğrenci Takibi",
    aciklama:
      "Koçlar öğrencileriyle düzenli görüşme yapar, gelişim notlarını tek tıkla kayıt altına alır.",
  },
  {
    baslik: "Onay Akışı & Loglar",
    aciklama:
      "Görüşmeler admin onayından sonra veliye yansır. Tüm değişiklikler log'lanır, kim ne yaptı görünür.",
  },
  {
    baslik: "Eşleştirme ve Raporlama",
    aciklama:
      "İl bazlı filtre ve toplu eşleştirme ile binlerce öğrenci kolayca koç/koordinatör atanır.",
  },
];

export default function AnaSayfa() {
  return (
    <main className="flex-1">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-md bg-slate-900 text-white font-bold">
              K
            </div>
            <span className="text-lg font-semibold">KARE-Rehber</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/ogrenci-kayit-formu"
              className="text-slate-600 hover:text-slate-900"
            >
              Öğrenci Kayıt
            </Link>
            <Link
              href="/koc-on-basvuru"
              className="text-slate-600 hover:text-slate-900"
            >
              Koç Başvuru
            </Link>
            <Link
              href="/giris"
              className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Giriş Yap
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Öğrenci gelişimini şeffaf,{" "}
            <span className="text-slate-500">kayıt altında</span> takip edin.
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            KARE-Rehber; koçların, koordinatörlerin, velilerin ve adminlerin tek
            bir platformda buluştuğu, görüşmeleri ve gelişim sürecini eksiksiz
            kayıt altına alan bir takip sistemidir.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/ogrenci-kayit-formu"
              className="rounded-md bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
            >
              Öğrenci Olarak Başvur
            </Link>
            <Link
              href="/koc-on-basvuru"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-slate-900 hover:bg-slate-100"
            >
              Koç Olarak Başvur
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-3">
          {ozellikler.map((o) => (
            <div
              key={o.baslik}
              className="rounded-lg border border-slate-200 p-6"
            >
              <h3 className="text-base font-semibold">{o.baslik}</h3>
              <p className="mt-2 text-sm text-slate-600">{o.aciklama}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} KARE-Rehber</span>
          <span>MVP — F0 iskelet</span>
        </div>
      </footer>
    </main>
  );
}
