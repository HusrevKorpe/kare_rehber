import Link from "next/link";
import type { Rol } from "@/generated/prisma/enums";
import { ROL_ETIKETLERI } from "@/lib/permissions";
import { okunmamisMesajSayisi } from "@/server/mesaj";
import { BildirimRozeti } from "./bildirim-rozeti";
import { CikisFormu } from "./cikis-formu";
import { SidebarLink } from "./sidebar-link";

export type MenuOge = {
  href: string;
  baslik: string;
  yakinda?: boolean;
};

type Props = {
  rol: Rol;
  isim: string;
  menu: MenuOge[];
  children: React.ReactNode;
};

export async function PanelShell({ rol, isim, menu, children }: Props) {
  const mesajSayisi = await okunmamisMesajSayisi();
  return (
    <div className="flex min-h-full flex-1 bg-slate-50">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <Link href="/" className="flex items-center gap-2 px-2 py-2">
          <div className="grid size-8 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white">
            K
          </div>
          <span className="text-base font-semibold">KARE-Rehber</span>
        </Link>
        <nav className="mt-6 space-y-1">
          {menu.map((m) => (
            <SidebarLink
              key={m.href}
              href={m.href}
              yakinda={m.yakinda}
              rozet={m.href.endsWith("/mesajlar") ? mesajSayisi : undefined}
            >
              {m.baslik}
            </SidebarLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">{ROL_ETIKETLERI[rol]} paneli</div>
          <div className="flex items-center gap-3">
            <BildirimRozeti rol={rol} />
            <span className="text-sm font-medium text-slate-800">{isim}</span>
            <CikisFormu />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
