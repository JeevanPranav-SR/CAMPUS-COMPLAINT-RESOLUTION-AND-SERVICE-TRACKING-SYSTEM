"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, ErrorState, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { getLocation } from "@/lib/campus";
import { remainingLabel } from "@/lib/utils";
import type { Ticket } from "@/lib/types";
import type { SessionUser } from "@/lib/session";
import { allowedTransitions, canAssign } from "@/lib/permissions";
import type { Status } from "@/lib/constants";

const COLUMNS = [
  { id: "SUBMITTED", match: ["SUBMITTED"] },
  { id: "ACKNOWLEDGED", match: ["ACKNOWLEDGED"] },
  { id: "ASSIGNED", match: ["ASSIGNED", "REOPENED"] },
  { id: "IN_PROGRESS", match: ["IN_PROGRESS", "ON_HOLD"] },
  { id: "RESOLVED", match: ["RESOLVED"] },
  { id: "CLOSED", match: ["CLOSED"] },
] as const;

type Staff = { id: string; name: string; department: string | null; role: string };

function actionLabel(status: Status) {
  if (status === "ACKNOWLEDGED") return "Acknowledge";
  if (status === "IN_PROGRESS") return "Start work";
  if (status === "ON_HOLD") return "Hold";
  if (status === "RESOLVED") return "Mark resolved";
  if (status === "ASSIGNED") return "Assign";
  return status.replace(/_/g, " ");
}

export default function OperationsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [ticketPayload, staffPayload, mePayload] = await Promise.all([
        api<{ complaints: Ticket[] }>("/api/complaints?pageSize=100"),
        api<{ staff: Staff[] }>("/api/staff"),
        api<{ user: SessionUser }>("/api/auth/me"),
      ]);
      setTickets(ticketPayload.complaints);
      setStaff(staffPayload.staff);
      setMe(mePayload.user);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load operations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ complaints: Ticket[] }>("/api/complaints?pageSize=100"),
      api<{ staff: Staff[] }>("/api/staff"),
      api<{ user: SessionUser }>("/api/auth/me"),
    ])
      .then(([ticketPayload, staffPayload, mePayload]) => {
        if (!active) return;
        setTickets(ticketPayload.complaints);
        setStaff(staffPayload.staff);
        setMe(mePayload.user);
        setError("");
      })
      .catch((err: Error) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load operations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function act(id: string, status?: Status, assigneeId?: string) {
    try {
      await api(`/api/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, assigneeId }),
      });
      toast("Complaint updated.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    }
  }

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((column) => [column.id, tickets.filter((ticket) => column.match.includes(ticket.status as never))]),
      ) as Record<string, Ticket[]>,
    [tickets],
  );

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Operations" description="Acknowledge, assign staff, work tickets, and mark them resolved." />
      <div className="flex gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((column) => (
          <section key={column.id} className="min-w-[260px] shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 md:min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{column.id.replace(/_/g, " ")}</h2>
              <span className="text-xs">{grouped[column.id]?.length ?? 0}</span>
            </div>
            <div className="space-y-3">
              {(grouped[column.id] ?? []).length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No tickets</p>
              ) : (
                grouped[column.id].map((ticket) => {
                  const allowed = me ? allowedTransitions(ticket.status as Status, me.role).filter((status) => status !== "CLOSED" && status !== "REOPENED" && status !== "ASSIGNED") : [];
                  return (
                    <article key={ticket.id} className="rounded-md border border-[var(--border)] p-3">
                      <Link href={`/dashboard/complaints/${ticket.id}`} className="block">
                        <p className="font-mono text-[11px] text-[var(--accent)]">{ticket.ticketNo}</p>
                        <p className="mt-1 text-sm font-medium">{ticket.title}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{getLocation(ticket.locationId)?.shortName}</p>
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <PriorityBadge priority={ticket.priority} />
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {ticket.assignee?.name ? `Assigned: ${ticket.assignee.name}` : "Unassigned"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</p>
                      {me && canAssign(me.role) && ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "REOPENED"].includes(ticket.status) ? (
                        <div className="mt-2 space-y-2">
                          <Select
                            value={assignTo[ticket.id] ?? ticket.assigneeId ?? ""}
                            onChange={(event) => setAssignTo((current) => ({ ...current, [ticket.id]: event.target.value }))}
                            aria-label={`Assign ${ticket.ticketNo}`}
                          >
                            <option value="">Select staff</option>
                            {staff.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.name}
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={!(assignTo[ticket.id] || ticket.assigneeId)}
                            onClick={() => act(ticket.id, "ASSIGNED", assignTo[ticket.id] || ticket.assigneeId || undefined)}
                          >
                            Assign
                          </Button>
                        </div>
                      ) : null}
                      {me?.role === "STAFF" && !ticket.assigneeId ? (
                        <Button size="sm" className="mt-2 w-full" onClick={() => act(ticket.id, undefined, me.id)}>
                          Take ticket
                        </Button>
                      ) : null}
                      {allowed.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-2">
                          {allowed.map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={status === "RESOLVED" ? "primary" : "secondary"}
                              onClick={() => act(ticket.id, status)}
                            >
                              {actionLabel(status)}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
