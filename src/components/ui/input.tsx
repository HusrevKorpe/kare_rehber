import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border bg-white px-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-slate-50 disabled:text-slate-500",
          invalid ? "border-red-400" : "border-slate-300",
          className,
        )}
        {...props}
      />
    );
  },
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500",
          invalid ? "border-red-400" : "border-slate-300",
          className,
        )}
        {...props}
      />
    );
  },
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border bg-white px-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500",
          invalid ? "border-red-400" : "border-slate-300",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
