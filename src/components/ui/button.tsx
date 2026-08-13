import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-slate-50 dark:hover:bg-white/5",
        variant === "ghost" && "text-[var(--muted)] hover:bg-slate-100 dark:hover:bg-white/5",
        variant === "danger" && "bg-[var(--danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}
