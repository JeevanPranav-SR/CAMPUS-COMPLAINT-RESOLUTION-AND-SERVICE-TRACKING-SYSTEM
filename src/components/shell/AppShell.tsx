"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Plus,
  Search,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { ROLE_META } from "@/lib/constants";
import { api } from "@/lib/client";
import { cn, initials } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/complaints", label: "Complaints", icon: ClipboardList },
  { href: "/dashboard/complaints/new", label: "Report issue", icon: Plus, roles: ["STUDENT", "FACULTY"] },
  { href: "/dashboard/operations", label: "Operations", icon: Wrench, roles: ["STAFF", "WARDEN", "ADMIN"] },
  { href: "/dashboard/map", label: "Campus map", icon: MapPinned },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity, roles: ["STAFF", "WARDEN", "ADMIN"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<{ notifications: NotificationItem[]; unread: number }>("/api/notifications")
      .then((payload) => setUnread(payload.unread))
      .catch(() => setUnread(0));
  }, [pathname]);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || !payload?.success) throw new Error("Logout failed");
      router.push("/");
      router.refresh();
    } catch {
      toast("Unable to sign out. Please try again.", "error");
    }
  }

  const links = NAV.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)] md:flex">
        <Link href="/dashboard" className="border-b border-white/10 px-5 py-5">
          <p className="text-sm font-semibold tracking-wide">BIT Service Ops</p>
          <p className="mt-1 text-[11px] text-white/60">Campus operations platform</p>
        </Link>
        <nav className="flex-1 space-y-0.5 p-3">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                  active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === "/dashboard/notifications" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] text-white">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-[11px] text-white/60">{ROLE_META[user.role].label}</p>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(`/dashboard/complaints?q=${encodeURIComponent(query)}`);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets, buildings, issues"
              aria-label="Search complaints"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm"
            />
          </form>
          <Link href="/dashboard/notifications" className="relative rounded-md p-2 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
          </Link>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:inline">
            {ROLE_META[user.role].label}
          </span>
          <button onClick={logout} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
            {initials(user.name)}
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
            <div className="h-full w-64 bg-[var(--sidebar)] p-4 text-[var(--sidebar-text)]" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">BIT Service Ops</p>
                <button onClick={() => setOpen(false)} aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {links.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-white/80">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
