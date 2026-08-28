import Image from "next/image";
import Link from "next/link";

export function InstituteMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/bit-logo.png"
      alt="Bannari Amman Institute of Technology"
      width={328}
      height={60}
      className={`h-8 w-auto max-w-[220px] object-contain object-left sm:h-10 sm:max-w-[280px] ${className}`}
      priority={false}
    />
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide">BIT NEXUS</p>
          <p className="text-xs text-[var(--muted)]">Campus Complaint Resolution & Service Tracking</p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <InstituteMark />
          <div className="min-w-0">
            <p className="text-sm font-medium">Bannari Amman Institute of Technology</p>
            <p className="text-xs text-[var(--muted)]">© 2026 Bannari Amman Institute of Technology</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function BrandLockup({ light = false, href = "/dashboard" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      <span className="rounded-md bg-white px-2 py-1">
        <InstituteMark className="h-7 sm:h-8" />
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold tracking-wide ${light ? "text-white" : ""}`}>BIT NEXUS</span>
        <span className={`block text-[11px] ${light ? "text-white/70" : "text-[var(--muted)]"}`}>Campus operations</span>
      </span>
    </Link>
  );
}
