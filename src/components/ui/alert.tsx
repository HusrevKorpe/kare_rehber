import * as React from "react";
import { cn } from "@/lib/utils";

type Tonu = "bilgi" | "basari" | "uyari" | "hata";

const sinif: Record<Tonu, string> = {
  bilgi: "border-slate-200 bg-slate-50 text-slate-800",
  basari: "border-emerald-200 bg-emerald-50 text-emerald-800",
  uyari: "border-amber-200 bg-amber-50 text-amber-800",
  hata: "border-red-200 bg-red-50 text-red-800",
};

export function Alert({
  tonu = "bilgi",
  baslik,
  className,
  children,
}: {
  tonu?: Tonu;
  baslik?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", sinif[tonu], className)}>
      {baslik ? <div className="font-semibold">{baslik}</div> : null}
      {children ? <div className={baslik ? "mt-1" : undefined}>{children}</div> : null}
    </div>
  );
}
