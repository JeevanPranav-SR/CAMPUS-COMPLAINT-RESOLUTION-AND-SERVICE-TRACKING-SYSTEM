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
import { isReporter } from "@/lib/permissions";

export default function OverviewPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketTotal, setTicketTotal] = useState(0);
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
        const reporter = isReporter(mePayload.user.role);
        const [ticketPayload, statsPayload, notePayload] = await Promise.all([
          api<{ complaints: Ticket[]; total: number }>(`/api/complaints?pageSize=${reporter ? 100 : 8}`),
          reporter ? Promise.resolve(null) : api<StatsPayload>("/api/stats"),
          api<{ notifications: NotificationItem[] }>("/api/notifications"),
        ]);
        if (!active) return;
        setMe(mePayload.user);
        setTickets(ticketPayload.complaints);
        setTicketTotal(ticketPayload.total);
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
    const open = tickets.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
    return {
      all: stats?.totals.all ?? ticketTotal,
      open: stats?.totals.open ?? open.length,
      progress: stats?.byStatus.IN_PROGRESS ?? tickets.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: stats?.totals.resolved ?? tickets.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
      overdue: stats?.totals.breached ?? 0,
    };
  }, [tickets, stats, ticketTotal]);

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

  const reporter = isReporter(me.role);

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${me.name.split(" ")[0]}`}
        description={
          reporter
            ? "Track and manage your campus service requests."
            : `Operations overview · ${ROLE_META[me.role].label}`
        }
        actions={
          reporter ? (
            <Link href="/dashboard/complaints/new">
              <Button>+ Report an issue</Button>
            </Link>
          ) : (
            <Link href="/dashboard/operations">
              <Button>Open operations</Button>
            </Link>
          )
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(reporter
          ? [
              ["My complaints", mine.all],
              ["Open", mine.open],
              ["In progress", mine.progress],
              ["Resolved", mine.resolved],
            ]
          : [
              ["Total complaints", mine.all],
              ["Open", mine.open],
              ["In progress", mine.progress],
              ["Overdue", mine.overdue],
            ]
        ).map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent complaints</h2>
            <Link href="/dashboard/complaints" className="text-sm text-[var(--accent)]">
              View all
            </Link>
          </div>
          {tickets.length === 0 ? (
            <EmptyState title="No complaints yet." description="Issues you report will appear here." />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2 font-medium">Ticket</th>
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Location</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.slice(0, 8).map((ticket) => (
                      <tr key={ticket.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link href={`/dashboard/complaints/${ticket.id}`} className="text-[var(--accent)]">
                            {ticket.ticketNo}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{ticket.title}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{getLocation(ticket.locationId)?.shortName}</td>
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
                {tickets.slice(0, 8).map((ticket) => (
                  <Link key={ticket.id} href={`/dashboard/complaints/${ticket.id}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="font-mono text-xs text-[var(--accent)]">{ticket.ticketNo}</p>
                    <p className="mt-1 font-medium">{ticket.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{getLocation(ticket.locationId)?.shortName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</p>
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
            <div className="mt-3 flex flex-col gap-2">
              {reporter ? (
                <Link href="/dashboard/complaints/new" className="text-sm text-[var(--accent)]">
                  Report a campus issue
                </Link>
              ) : null}
              <Link href="/dashboard/map" className="text-sm text-[var(--accent)]">
                Open campus map
              </Link>
              <Link href="/dashboard/complaints" className="text-sm text-[var(--accent)]">
                Browse complaints
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
