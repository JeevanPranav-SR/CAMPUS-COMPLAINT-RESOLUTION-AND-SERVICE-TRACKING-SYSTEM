import { STATUS_META, PRIORITY_META, type Priority, type Status } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as Status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta?.tone === "emerald" && "bg-emerald-400",
          meta?.tone === "amber" && "bg-amber-400",
          meta?.tone === "cyan" && "bg-cyan-400",
          meta?.tone === "violet" && "bg-violet-400",
          meta?.tone === "blue" && "bg-sky-400",
          meta?.tone === "zinc" && "bg-zinc-400",
          !meta && "bg-cyan-400",
        )}
      />
      {meta?.label ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority as Priority];
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", meta?.className)}>
      {meta?.label ?? priority}
    </span>
  );
}
