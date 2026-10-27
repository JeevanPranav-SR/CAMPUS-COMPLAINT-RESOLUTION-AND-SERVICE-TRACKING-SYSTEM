"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Plus,
  ScrollText,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { ROLE_META } from "@/lib/constants";
import { can, canAny, operationalScopeParam, type Permission } from "@/lib/rbac";
import { api } from "@/lib/client";
import { cn, initials } from "@/lib/utils";
import type { NotificationItem } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { UserProvider } from "@/components/auth/guards";
import { BrandLockup, SiteFooter } from "@/components/brand/SiteFooter";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  any?: Permission[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/complaints/new", label: "Raise complaint", icon: Plus, permission: "complaint:create" },
  { href: "/dashboard/complaints?scope=mine", label: "My complaints", icon: ClipboardList, permission: "complaint:view_own" },
  { href: "/dashboard/complaints?scope=assigned", label: "Assigned work", icon: ClipboardList, permission: "complaint:view_assigned" },
  { href: "/dashboard/complaints?scope=department", label: "Department complaints", icon: ClipboardList, permission: "complaint:view_department" },
  { href: "/dashboard/complaints?scope=all", label: "All campus complaints", icon: ClipboardList, permission: "complaint:view_all" },
  { href: "/dashboard/operations", label: "Operations", icon: Wrench, any: ["complaint:assign", "complaint:update_assigned"] },
  { href: "/dashboard/map", label: "Campus map", icon: MapPinned, permission: "complaint:view_own" },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity, any: ["analytics:view", "analytics:view_department"] },
  { href: "/dashboard/users", label: "Users", icon: Users, permission: "user:manage" },
  { href: "/dashboard/audit", label: "Audit logs", icon: ScrollText, permission: "audit:view" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Profile", icon: Settings },
];

function navVisible(user: SessionUser, item: NavItem) {
  if (item.permission) return can(user, item.permission);
  if (item.any) return canAny(user, item.any);
  return true;
}

function isActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  const scope = new URLSearchParams(search).get("scope");
  if (path === "/dashboard") return pathname === "/dashboard";
  if (query) {
    const wanted = new URLSearchParams(query).get("scope");
    return pathname === path && scope === wanted;
  }
  if (path === "/dashboard/complaints") {
    return pathname.startsWith("/dashboard/complaints") && pathname !== "/dashboard/complaints/new" && !scope;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const lastSeen = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll(announce: boolean) {
      try {
        const payload = await api<{ notifications: NotificationItem[]; unread: number }>("/api/notifications");
        if (!active) return;
        setUnread(payload.unread);
        const newest = payload.notifications.find((item) => !item.read);
        if (announce && newest && lastSeen.current !== null && newest.id !== lastSeen.current) {
          toast(`${newest.title}: ${newest.body}`);
        }
        lastSeen.current = newest?.id ?? "";
      } catch {
        if (active) setUnread(0);
      }
    }
    poll(false);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") poll(true);
    }, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pathname, toast]);

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

  const links = NAV.filter((item) => navVisible(user, item))
    .filter((item) => {
      if (item.href === "/dashboard/complaints?scope=assigned" && (can(user, "complaint:view_all") || can(user, "complaint:view_department"))) return false;
      if (item.href === "/dashboard/complaints?scope=department" && can(user, "complaint:view_all")) return false;
      return true;
    })
    .map((item) => {
      if (item.href === "/dashboard/analytics") {
        return { ...item, label: can(user, "analytics:view") ? "Campus analytics" : "Department analytics" };
      }
      if (item.href === "/dashboard/operations") {
        return {
          ...item,
          label: can(user, "complaint:view_all")
            ? "Operations"
            : can(user, "complaint:view_department")
              ? "Department operations"
              : "Work board",
        };
      }
      return item;
    });

  function searchTickets(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("scope", operationalScopeParam(user));
    if (query.trim()) params.set("q", query.trim());
    router.push(`/dashboard/complaints?${params.toString()}`);
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen min-w-0 flex-col overflow-hidden bg-[var(--sidebar)] text-[var(--sidebar-text)] md:flex">
          <div className="min-w-0 shrink-0 overflow-hidden border-b border-white/10 px-3 py-4">
            <BrandLockup light stacked />
            <p className="mt-3 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80">{ROLE_META[user.role].label}</p>
          </div>
          <nav className="min-w-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-3">
            {links.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, search, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.href === "/dashboard/notifications" && unread > 0 ? (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] text-white">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0 overflow-hidden border-t border-white/10 p-4">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-[11px] text-white/60">{ROLE_META[user.role].label}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <button className="shrink-0 md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <form className="relative min-w-0 flex-1" onSubmit={searchTickets}>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets, buildings, issues"
                aria-label="Search complaints"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm"
              />
            </form>
            <Link href="/dashboard/notifications" className="relative shrink-0 rounded-md p-2 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
            </Link>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:inline">
              {ROLE_META[user.role].label}
            </span>
            <button onClick={logout} className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
              {initials(user.name)}
            </div>
          </header>

          {open ? (
            <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
              <div className="h-full w-64 overflow-y-auto bg-[var(--sidebar)] p-4 text-[var(--sidebar-text)]" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <BrandLockup light stacked />
                  </div>
                  <button className="shrink-0" onClick={() => setOpen(false)} aria-label="Close navigation">
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
          <SiteFooter />
        </div>
      </div>
    </UserProvider>
  );
}
