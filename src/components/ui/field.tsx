import * as React from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hata?: string;
  ipucu?: string;
  children: React.ReactNode;
  className?: string;
  zorunlu?: boolean;
};

export function Field({
  label,
  htmlFor,
  hata,
  ipucu,
  children,
  className,
  zorunlu,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {zorunlu ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
      {hata ? (
        <p className="text-xs text-red-600">{hata}</p>
      ) : ipucu ? (
        <p className="text-xs text-slate-500">{ipucu}</p>
      ) : null}
    </div>
  );
}
