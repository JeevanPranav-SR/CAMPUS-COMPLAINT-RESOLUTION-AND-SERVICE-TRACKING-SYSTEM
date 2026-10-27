"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badges";
import { api } from "@/lib/client";
import { ROLE_META } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import { greeting, remainingLabel } from "@/lib/utils";
import type { NotificationItem, StatsPayload, Ticket } from "@/lib/types";
import type { SessionUser } from "@/lib/session";
import { can, canAny, operationalScopeParam } from "@/lib/rbac";

function dashboardCopy(role: SessionUser["role"]) {
  if (role === "STUDENT") {
    return {
      description: "Raise a complaint and track its progress. You only see tickets you filed.",
      primary: { href: "/dashboard/complaints/new", label: "+ Raise complaint" },
      stats: "own" as const,
    };
  }
  if (role === "FACULTY") {
    return {
      description: "Raise campus issues and track the complaints you have filed.",
      primary: { href: "/dashboard/complaints/new", label: "+ Raise complaint" },
      stats: "own" as const,
    };
  }
  if (role === "TECHNICIAN") {
    return {
      description: "File your own issues and work the tickets routed to your department or assigned to you.",
      primary: { href: "/dashboard/operations", label: "Open assigned work" },
      stats: "work" as const,
    };
  }
  if (role === "DEPARTMENT_HEAD") {
    return {
      description: "Raise your own issues, triage complaints routed to your department, and assign technicians.",
      primary: { href: "/dashboard/operations", label: "Manage department work" },
      stats: "ops" as const,
    };
  }
  return {
    description: "Super Admin: oversee every department, manage users and roles, and monitor service performance.",
    primary: { href: "/dashboard/complaints?scope=all", label: "View all complaints" },
    stats: "ops" as const,
  };
}

export default function OverviewPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [mineTickets, setMineTickets] = useState<Ticket[]>([]);
  const [mineTotal, setMineTotal] = useState(0);
  const [opsTickets, setOpsTickets] = useState<Ticket[]>([]);
  const [opsTotal, setOpsTotal] = useState(0);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ user: SessionUser }>("/api/auth/me")
      .then(async (mePayload) => {
        if (!active) return;
        const user = mePayload.user;
        const showStats = canAny(user, ["analytics:view", "analytics:view_department"]);
        const opsScope = operationalScopeParam(user);
        const ops = opsScope !== "mine";
        const [minePayload, opsPayload, statsPayload, notePayload] = await Promise.all([
          api<{ complaints: Ticket[]; total: number }>("/api/complaints?scope=mine&pageSize=20"),
          ops
            ? api<{ complaints: Ticket[]; total: number }>(`/api/complaints?scope=${opsScope}&pageSize=40`)
            : Promise.resolve({ complaints: [] as Ticket[], total: 0 }),
          showStats ? api<StatsPayload>("/api/stats") : Promise.resolve(null),
          api<{ notifications: NotificationItem[] }>("/api/notifications"),
        ]);
        if (!active) return;
        setMe(user);
        setMineTickets(minePayload.complaints);
        setMineTotal(minePayload.total);
        setOpsTickets(ops ? opsPayload.complaints : minePayload.complaints);
        setOpsTotal(ops ? opsPayload.total : minePayload.total);
        setStats(statsPayload);
        setNotes(notePayload.notifications.slice(0, 4));
        setError("");
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const mine = useMemo(() => {
    const source = stats ? [] : opsTickets;
    const open = source.filter((item) => !["RESOLVED", "CLOSED", "REJECTED"].includes(item.status));
    return {
      all: stats?.totals.all ?? opsTotal,
      open: stats?.totals.open ?? open.length,
      progress: stats?.byStatus.IN_PROGRESS ?? source.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: stats?.totals.resolved ?? source.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
      overdue: stats?.totals.breached ?? source.filter((item) => !["RESOLVED", "CLOSED", "REJECTED"].includes(item.status) && new Date(item.dueAt).getTime() < Date.now()).length,
      assigned: opsTickets.filter((item) => me && item.assigneeId === me.id && !["RESOLVED", "CLOSED"].includes(item.status)).length,
      mineOpen: mineTickets.filter((item) => !["RESOLVED", "CLOSED", "REJECTED"].includes(item.status)).length,
      mineProgress: mineTickets.filter((item) => item.status === "IN_PROGRESS").length,
      mineResolved: mineTickets.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
    };
  }, [opsTickets, opsTotal, stats, me, mineTickets]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }} />;
  if (!me) return null;

  const copy = dashboardCopy(me.role);
  const openWork = (ticket: Ticket) => !["RESOLVED", "CLOSED", "REJECTED"].includes(ticket.status);
  const attention = (copy.stats === "own" ? mineTickets : opsTickets)
    .filter(openWork)
    .sort((a, b) => {
      const unassigned = Number(Boolean(a.assigneeId)) - Number(Boolean(b.assigneeId));
      if (unassigned) return unassigned;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  const attentionHref =
    copy.stats === "own"
      ? "/dashboard/complaints?scope=mine"
      : `/dashboard/complaints?scope=${operationalScopeParam(me)}`;
  const cards =
    copy.stats === "own"
      ? [
          ["My complaints", mineTotal],
          ["Open", mine.mineOpen],
          ["In progress", mine.mineProgress],
          ["Resolved", mine.mineResolved],
        ]
      : copy.stats === "work"
        ? [
            ["My complaints", mineTotal],
            ["Assigned to me", mine.assigned],
            ["In progress", mine.progress],
            ["Overdue", mine.overdue],
          ]
        : [
            ["My complaints", mineTotal],
            ["Open in scope", mine.open],
            ["In progress", mine.progress],
            ["Overdue", mine.overdue],
          ];

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${me.name.split(" ")[0]}`}
        description={copy.description}
        actions={
          <Link href={copy.primary.href}>
            <Button>{copy.primary.label}</Button>
          </Link>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-base font-semibold">{copy.stats === "own" ? "My complaints" : "Needs attention"}</h2>
            <Link href={attentionHref} className="shrink-0 text-sm text-[var(--accent)]">
              View all
            </Link>
          </div>
          {attention.length === 0 ? (
            <EmptyState title="No complaints yet." description="Issues in your access scope will appear here." />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Ticket</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Location</th>
                      <th className="px-4 py-2 font-medium">Technician</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attention.slice(0, 8).map((ticket) => (
                      <tr key={ticket.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link href={`/dashboard/complaints/${ticket.id}`} className="text-[var(--accent)]">
                            {ticket.ticketNo}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{ticket.title}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{getLocation(ticket.locationId)?.shortName}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{ticket.assignee?.name ?? "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--muted)]">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">
                {attention.slice(0, 8).map((ticket) => (
                  <Link key={ticket.id} href={`/dashboard/complaints/${ticket.id}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="font-mono text-xs text-[var(--accent)]">{ticket.ticketNo}</p>
                    <p className="mt-1 font-medium">{ticket.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {getLocation(ticket.locationId)?.shortName} · {ticket.assignee?.name ?? "Unassigned"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-semibold">Notifications</h2>
            {notes.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">You&apos;re all caught up.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="font-medium">{note.title}</p>
                    <p className="text-[var(--muted)]">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="text-base font-semibold">Quick actions</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{ROLE_META[me.role].blurb}</p>
            <div className="mt-3 flex flex-col gap-2">
              {can(me, "complaint:create") ? (
                <Link href="/dashboard/complaints/new" className="text-sm text-[var(--accent)]">
                  Raise a complaint
                </Link>
              ) : null}
              {can(me, "complaint:view_own") ? (
                <Link href="/dashboard/complaints?scope=mine" className="text-sm text-[var(--accent)]">
                  Track my complaints
                </Link>
              ) : null}
              {canAny(me, ["complaint:assign", "complaint:update_assigned"]) ? (
                <Link href="/dashboard/operations" className="text-sm text-[var(--accent)]">
                  Open assigned work
                </Link>
              ) : null}
              {can(me, "user:manage") ? (
                <Link href="/dashboard/users" className="text-sm text-[var(--accent)]">
                  Manage users
                </Link>
              ) : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
