import * as React from "react";
import { cn } from "@/lib/utils";

type Tonu = "notr" | "basari" | "uyari" | "hata" | "bilgi";

const sinif: Record<Tonu, string> = {
  notr: "bg-slate-100 text-slate-700",
  basari: "bg-emerald-100 text-emerald-700",
  uyari: "bg-amber-100 text-amber-800",
  hata: "bg-red-100 text-red-700",
  bilgi: "bg-sky-100 text-sky-700",
};

export function Badge({
  tonu = "notr",
  className,
  children,
}: {
  tonu?: Tonu;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        sinif[tonu],
        className,
      )}
    >
      {children}
    </span>
  );
}
