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
import { ClientGuard, useUser } from "@/components/auth/guards";
import { allowedTransitions, can, canAssign, operationalScopeParam } from "@/lib/rbac";
import { ACTION_LABELS, ASSIGNABLE_STATUSES, REASON_REQUIRED, STATUS_META, type Status } from "@/lib/constants";
import { OPS_DEPARTMENTS, departmentName, opsDepartmentOf, routeComplaint, type OpsDepartmentId } from "@/lib/routing";
import { staffOptionLabel } from "@/lib/specialties";

const COLUMNS: { id: string; label: string; match: Status[] }[] = [
  { id: "SUBMITTED", label: STATUS_META.SUBMITTED.label, match: ["SUBMITTED"] },
  { id: "ACKNOWLEDGED", label: STATUS_META.ACKNOWLEDGED.label, match: ["ACKNOWLEDGED"] },
  { id: "ASSIGNED", label: "Assigned / reopened", match: ["ASSIGNED", "REOPENED"] },
  { id: "IN_PROGRESS", label: "In progress / on hold", match: ["IN_PROGRESS", "ON_HOLD"] },
  { id: "ESCALATED", label: STATUS_META.ESCALATED.label, match: ["ESCALATED"] },
  { id: "RESOLVED", label: "Awaiting verification", match: ["RESOLVED"] },
  { id: "CLOSED", label: "Closed / rejected", match: ["CLOSED", "REJECTED"] },
];

type Staff = { id: string; name: string; department: string | null; role: string; specialty?: string | null; experienceYears?: number };

function actionLabel(current: Status, next: Status) {
  if (current === "ON_HOLD" && next === "IN_PROGRESS") return "Resume work";
  return ACTION_LABELS[next];
}

export default function OperationsPage() {
  const toast = useToast();
  const me = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignTo, setAssignTo] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [department, setDepartment] = useState<OpsDepartmentId | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!me) return;
    let active = true;
    const scope = operationalScopeParam(me);
    Promise.allSettled([
      api<{ complaints: Ticket[] }>(`/api/complaints?pageSize=100&scope=${scope}`),
      api<{ staff: Staff[] }>("/api/staff"),
    ]).then(([ticketResult, staffResult]) => {
      if (!active) return;
      if (ticketResult.status === "fulfilled") {
        setTickets(ticketResult.value.complaints);
        setError("");
      } else {
        setError(ticketResult.reason instanceof Error ? ticketResult.reason.message : "Unable to load operations");
      }
      setStaff(staffResult.status === "fulfilled" ? staffResult.value.staff : []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [me, reload]);

  async function act(ticket: Ticket, change: { status?: Status; assigneeId?: string; autoAssign?: boolean }) {
    let note: string | undefined;
    if (change.status && REASON_REQUIRED.includes(change.status)) {
      const answer = window.prompt(`Reason to ${ACTION_LABELS[change.status].toLowerCase()} ${ticket.ticketNo}:`);
      if (answer === null) return;
      if (answer.trim().length < 4) {
        toast("Please give a short reason (at least 4 characters).", "error");
        return;
      }
      note = answer.trim();
    }
    setBusyId(ticket.id);
    const nextStatus =
      change.status ??
      ((change.assigneeId || change.autoAssign) && ASSIGNABLE_STATUSES.includes(ticket.status as Status) ? "ASSIGNED" : ticket.status);
    if (!change.autoAssign) {
      setTickets((current) =>
        current.map((item) =>
          item.id === ticket.id
            ? {
                ...item,
                ...change,
                status: nextStatus,
                assigneeId: change.assigneeId ?? item.assigneeId,
                assignee: change.assigneeId ? staff.find((person) => person.id === change.assigneeId) ?? item.assignee : item.assignee,
              }
            : item,
        ),
      );
    }
    try {
      const payload = await api<{ complaint: Ticket }>(`/api/complaints/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...change, note }),
      });
      const updated = payload.complaint;
      setTickets((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setAssignTo((current) => {
        const next = { ...current };
        delete next[ticket.id];
        return next;
      });
      toast(
        change.autoAssign || change.assigneeId
          ? `${updated.ticketNo} assigned to ${updated.assignee?.name ?? "technician"}.`
          : `${updated.ticketNo} is now ${STATUS_META[updated.status as Status]?.label.toLowerCase() ?? updated.status}.`,
      );
    } catch (err) {
      setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item)));
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(
    () => (department ? tickets.filter((ticket) => routeComplaint(ticket.category, ticket.locationId) === department) : tickets),
    [tickets, department],
  );

  const grouped = useMemo(
    () => Object.fromEntries(COLUMNS.map((column) => [column.id, visible.filter((ticket) => column.match.includes(ticket.status as Status))])),
    [visible],
  );

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} />;

  const campusWide = me ? can(me, "complaint:view_all") : false;

  return (
    <ClientGuard any={["complaint:assign", "complaint:update_assigned"]}>
      <div>
        <PageHeader
          title={campusWide ? "Operations" : me?.role === "TECHNICIAN" ? "Work board" : "Department operations"}
          description={
            campusWide
              ? "Every department's tickets. Review, assign, escalate and resolve."
              : me?.role === "TECHNICIAN"
                ? `Tickets assigned to you, plus unassigned ${me.department ?? ""} tickets you can take.`
                : `Tickets routed to ${me?.department ?? "your department"}. Assign technicians and track progress.`
          }
          actions={
            campusWide ? (
              <Select className="sm:w-56" value={department} onChange={(event) => setDepartment(event.target.value as OpsDepartmentId | "")} aria-label="Filter by department">
                <option value="">All departments</option>
                {OPS_DEPARTMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
          {COLUMNS.map((column) => (
            <section key={column.id} className="flex w-72 shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{column.label}</h2>
                <span className="rounded-full bg-slate-100 px-2 text-xs tabular-nums text-slate-600">{grouped[column.id]?.length ?? 0}</span>
              </div>
              <div className="space-y-3">
                {(grouped[column.id] ?? []).length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No tickets</p>
                ) : (
                  grouped[column.id].map((ticket) => {
                    const status = ticket.status as Status;
                    const routed = routeComplaint(ticket.category, ticket.locationId);
                    const busy = busyId === ticket.id;
                    const allowed = me
                      ? allowedTransitions(status, me, ticket).filter((next) => !["CLOSED", "REOPENED", "ASSIGNED"].includes(next))
                      : [];
                    const team = staff.filter(
                      (person) => opsDepartmentOf(person.department) === routed || person.id === ticket.assigneeId,
                    );
                    const choices = team.length ? team : staff;
                    const selected = assignTo[ticket.id] ?? ticket.assigneeId ?? "";
                    const showAssign = Boolean(me && canAssign(me) && ASSIGNABLE_STATUSES.includes(status));
                    return (
                      <article key={ticket.id} className={`rounded-md border border-[var(--border)] p-3 ${busy ? "opacity-60" : ""}`} aria-busy={busy}>
                        <Link href={`/dashboard/complaints/${ticket.id}`} className="block">
                          <p className="font-mono text-[11px] text-[var(--accent)]">{ticket.ticketNo}</p>
                          <p className="mt-1 break-words text-sm font-medium">{ticket.title}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {getLocation(ticket.locationId)?.shortName} · {departmentName(routed)}
                          </p>
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <PriorityBadge priority={ticket.priority} />
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          {ticket.assignee?.name ? `Technician: ${ticket.assignee.name}` : "Unassigned"}
                        </p>
                        <p className="text-xs text-[var(--muted)]">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</p>
                        {showAssign ? (
                          <div className="mt-2 space-y-2">
                            <Select
                              value={selected}
                              disabled={busy}
                              onChange={(event) => setAssignTo((current) => ({ ...current, [ticket.id]: event.target.value }))}
                              aria-label={`Technician for ${ticket.ticketNo}`}
                            >
                              <option value="">Select technician</option>
                              {choices.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {staffOptionLabel(person)}
                                  {team.length ? "" : ` · ${person.department ?? ""}`}
                                </option>
                              ))}
                            </Select>
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={busy || !selected || selected === ticket.assigneeId}
                              onClick={() => act(ticket, { assigneeId: selected })}
                            >
                              {busy ? "Saving…" : ticket.assigneeId ? "Reassign" : "Assign"}
                            </Button>
                            {!ticket.assigneeId ? (
                              <Button size="sm" variant="secondary" className="w-full" disabled={busy} onClick={() => act(ticket, { autoAssign: true })}>
                                {busy ? "Saving…" : "AI auto-assign"}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                        {me?.role === "TECHNICIAN" && !ticket.assigneeId ? (
                          <Button size="sm" className="mt-2 w-full" disabled={busy} onClick={() => act(ticket, { assigneeId: me.id })}>
                            {busy ? "Saving…" : "Take ticket"}
                          </Button>
                        ) : null}
                        {allowed.length > 0 ? (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {allowed.map((next) => (
                              <Button
                                key={next}
                                size="sm"
                                disabled={busy}
                                variant={next === "RESOLVED" ? "primary" : next === "REJECTED" ? "danger" : "secondary"}
                                className={allowed.length === 1 ? "col-span-2" : ""}
                                onClick={() => act(ticket, { status: next })}
                              >
                                {actionLabel(status, next)}
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
    </ClientGuard>
  );
}
