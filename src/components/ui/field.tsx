import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-[var(--text)]">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
    </label>
  );
}

const control = "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-slate-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "bg-[var(--surface)]", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, className)} {...props} />;
}
