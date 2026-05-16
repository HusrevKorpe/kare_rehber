import Link from "next/link";
import { Bell } from "lucide-react";
import { okunmamisBildirimSayisi } from "@/server/bildirim";
import type { Rol } from "@/generated/prisma/enums";
import { ROL_PANELLERI } from "@/lib/permissions";

export async function BildirimRozeti({ rol }: { rol: Rol }) {
  const sayi = await okunmamisBildirimSayisi();
  const href = `${ROL_PANELLERI[rol]}/bildirimler`;
  return (
    <Link
      href={href}
      className="relative inline-flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      aria-label="Bildirimler"
    >
      <Bell className="size-5" aria-hidden />
      {sayi > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
          {sayi > 99 ? "99+" : sayi}
        </span>
      ) : null}
    </Link>
  );
}
