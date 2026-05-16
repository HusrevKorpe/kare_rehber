import { cikisYap } from "@/server/oturum";

export function CikisFormu() {
  return (
    <form action={cikisYap}>
      <button
        type="submit"
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Çıkış
      </button>
    </form>
  );
}
