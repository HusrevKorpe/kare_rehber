import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
