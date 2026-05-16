"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  yakinda?: boolean;
  rozet?: number;
};

export function SidebarLink({ href, children, yakinda, rozet }: Props) {
  const pathname = usePathname();
  const aktif =
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  if (yakinda) {
    return (
      <span
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400"
        aria-disabled
      >
        <span>{children}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
          yakında
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        aktif
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      <span>{children}</span>
      {rozet && rozet > 0 ? (
        <span
          className={cn(
            "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold leading-4",
            aktif ? "bg-white text-slate-900" : "bg-red-600 text-white",
          )}
        >
          {rozet > 99 ? "99+" : rozet}
        </span>
      ) : null}
    </Link>
  );
}
