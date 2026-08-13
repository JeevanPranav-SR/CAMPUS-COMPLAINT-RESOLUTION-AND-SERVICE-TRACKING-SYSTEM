"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Plus,
  Radar,
  Wrench,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { ROLE_META } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
  { href: "/dashboard/map", label: "Campus map", icon: MapPinned },
  { href: "/dashboard/complaints", label: "Tickets", icon: ClipboardList },
  { href: "/dashboard/complaints/new", label: "File issue", icon: Plus },
  { href: "/dashboard/operations", label: "Operations", icon: Wrench, roles: ["STAFF", "WARDEN", "ADMIN"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity, roles: ["STAFF", "WARDEN", "ADMIN", "FACULTY"] },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/8 p-5 md:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-400 font-display text-lg font-bold text-slate-950">
              BIT
            </div>
            <div>
              <p className="font-display text-lg leading-none tracking-wide">NEXUS</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">Campus service OS</p>
            </div>
          </Link>
          <nav className="mt-8 space-y-1">
            {NAV.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 font-display text-sm text-cyan-200">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {ROLE_META[user.role].label}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-cyan-400 font-display text-sm font-bold text-slate-950">
                BIT
              </div>
              <p className="font-display">NEXUS</p>
            </div>
            <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400 md:flex">
              <Radar className="h-3.5 w-3.5 text-cyan-300" />
              Bannari Amman Institute of Technology · Sathyamangalam
            </div>
            <Link
              href="/dashboard/complaints/new"
              className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
            >
              New ticket
            </Link>
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-white/5 px-4 py-2 md:hidden">
            {NAV.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                  pathname === item.href ? "bg-white/10 text-white" : "text-slate-400",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
