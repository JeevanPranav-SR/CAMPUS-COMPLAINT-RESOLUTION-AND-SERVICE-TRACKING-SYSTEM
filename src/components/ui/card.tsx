import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ kicker, title, description, actions }: { kicker?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{kicker}</p> : null}
        <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}{" "}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-medium underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-white/10", className)} />;
}
