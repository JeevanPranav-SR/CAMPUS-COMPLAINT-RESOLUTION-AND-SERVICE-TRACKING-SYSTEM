import { STATUS_META, PRIORITY_META, type Priority, type Status } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-800",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  orange: "bg-orange-50 text-orange-800",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as Status];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tones[meta?.tone ?? "slate"])}>
      {meta?.label ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority as Priority];
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tones[meta?.tone ?? "slate"])}>
      {meta?.label ?? priority}
    </span>
  );
}
