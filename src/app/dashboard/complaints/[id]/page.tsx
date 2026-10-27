"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CampusMap from "@/components/map/CampusMap";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { ACTION_LABELS, ASSIGNABLE_STATUSES, CATEGORIES, LIFECYCLE, normalizeRole, REASON_REQUIRED, ROLE_META, STATUS_META, type Status } from "@/lib/constants";
import { departmentName, routeComplaint } from "@/lib/routing";
import { getLocation } from "@/lib/campus";
import { allowedTransitions, canAssign, canUpdateWork, isOwner } from "@/lib/rbac";
import { formatDateTime, remainingLabel, slaState } from "@/lib/utils";
import type { Ticket } from "@/lib/types";
import type { SessionUser } from "@/lib/session";

type Staff = { id: string; name: string; department: string | null; role: string };

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [ticketPayload, mePayload] = await Promise.all([
        api<{ complaint: Ticket; staff: Staff[] }>(`/api/complaints/${params.id}`),
        api<{ user: SessionUser }>("/api/auth/me"),
      ]);
      setTicket(ticketPayload.complaint);
      setStaff(ticketPayload.staff);
      setMe(mePayload.user);
      setAssigneeId(ticketPayload.complaint.assigneeId ?? "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load complaint");
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ complaint: Ticket; staff: Staff[] }>(`/api/complaints/${params.id}`),
      api<{ user: SessionUser }>("/api/auth/me"),
    ])
      .then(([ticketPayload, mePayload]) => {
        if (!active) return;
        setTicket(ticketPayload.complaint);
        setStaff(ticketPayload.staff);
        setMe(mePayload.user);
        setAssigneeId(ticketPayload.complaint.assigneeId ?? "");
        setError("");
      })
      .catch((err: Error) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load complaint");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  async function update(status?: Status, assignTo?: string) {
    if (!ticket) return;
    if (status && REASON_REQUIRED.includes(status) && note.trim().length < 4) {
      toast(`Write a short reason in the note box to ${ACTION_LABELS[status].toLowerCase()} this complaint.`, "error");
      return;
    }
    setBusy(true);
    try {
      const payload = await api<{ complaint: Ticket }>(`/api/complaints/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(status ? { status } : {}),
          ...(assignTo ? { assigneeId: assignTo } : {}),
          note: status === "REOPENED" ? reason : note,
          rating: status === "CLOSED" ? rating : undefined,
          ratingComment: status === "CLOSED" ? ratingComment : undefined,
        }),
      });
      setTicket(payload.complaint);
      setAssigneeId(payload.complaint.assigneeId ?? "");
      setNote("");
      setReason("");
      toast(
        assignTo
          ? `Assigned to ${payload.complaint.assignee?.name ?? "technician"}.`
          : `Status changed to ${STATUS_META[payload.complaint.status as Status]?.label.toLowerCase() ?? payload.complaint.status}.`,
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to update", "error");
    } finally {
      setBusy(false);
    }
  }

  async function sendComment(event: React.FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    setBusy(true);
    try {
      const payload = await api<{ complaint: Ticket }>(`/api/complaints/${ticket.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment }),
      });
      setTicket(payload.complaint);
      setComment("");
      toast("Comment added.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to comment", "error");
    } finally {
      setBusy(false);
    }
  }

  async function takeTicket() {
    if (!ticket || !me) return;
    setBusy(true);
    try {
      const payload = await api<{ complaint: Ticket }>(`/api/complaints/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeId: me.id }),
      });
      setTicket(payload.complaint);
      setAssigneeId(me.id);
      toast("Ticket assigned to you.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to take ticket", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!ticket || !me) return <Skeleton className="h-96" />;

  const location = getLocation(ticket.locationId);
  const unit = CATEGORIES.find((item) => item.id === ticket.category)?.unit;
  const allowed = allowedTransitions(ticket.status as Status, me, ticket);
  const sla = slaState(ticket.dueAt, ticket.status, ticket.resolvedAt);
  const ops = canUpdateWork(me, ticket) || canAssign(me);
  const owner = isOwner(me, ticket);
  const assignable = ASSIGNABLE_STATUSES.includes(ticket.status as Status);
  const opsActions = allowed.filter((status) => !["ASSIGNED", "CLOSED", "REOPENED"].includes(status));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <PageHeader
          kicker={ticket.ticketNo}
          title={ticket.title}
          description={`${location?.name ?? ""} ${ticket.landmark ? `· ${ticket.landmark}` : ""}`}
        />
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sla === "breached" || sla === "missed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
            {remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}
          </span>
        </div>
        <Card>
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{ticket.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Category</dt>
              <dd>{unit}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Routed to</dt>
              <dd>{departmentName(routeComplaint(ticket.category, ticket.locationId))}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Reporter</dt>
              <dd>{ticket.reporter?.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Created</dt>
              <dd>{formatDateTime(ticket.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Assignee</dt>
              <dd>{ticket.assignee?.name ?? "Unassigned"}</dd>
            </div>
          </dl>
          {ticket.evidence ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ticket.evidence} alt="Complaint evidence" className="mt-4 max-h-64 rounded-md border" />
          ) : null}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Lifecycle</h2>
          <ol className="mt-4 space-y-3">
            {(ticket.events ?? []).map((event) => (
              <li key={event.id} className="flex gap-3 border-l-2 border-slate-200 pl-3">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{STATUS_META[event.status as Status]?.label ?? event.status}</span>
                    {event.actor?.name ? ` · ${event.actor.name}` : ""}
                    {event.actor?.role ? ` (${ROLE_META[normalizeRole(event.actor.role)].label})` : ""}
                  </p>
                  <p className="text-sm text-slate-600">{event.note}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDateTime(event.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {LIFECYCLE.map((step) => (
              <span key={step} className={`rounded-full px-2 py-0.5 text-[11px] ${ticket.status === step || (ticket.status === "REOPENED" && step === "ASSIGNED") ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-600"}`}>
                {STATUS_META[step].label}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Comments</h2>
          <ul className="mt-3 space-y-2">
            {(ticket.comments ?? []).map((item) => (
              <li key={item.id} className="text-sm">
                <span className="font-medium">{item.actor.name}</span>
                <span className="text-[var(--muted)]"> · {formatDateTime(item.createdAt)}</span>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={sendComment} className="mt-3 space-y-2">
            <Textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a progress note or question" />
            <Button type="submit" size="sm" disabled={busy || comment.trim().length < 2}>
              Add comment
            </Button>
          </form>
        </Card>
      </div>
      <div className="space-y-4">
        <div className="h-72">
          <CampusMap tickets={[ticket]} selectedId={ticket.id} focus={[ticket.lat, ticket.lng]} />
        </div>
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">SLA</h2>
          <p className="text-lg font-semibold">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</p>
          <p className="text-xs text-[var(--muted)]">Current SLA window: {ticket.slaHours} hours.</p>
        </Card>
        {ops ? (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Operations</h2>
            {canAssign(me) && assignable ? (
              <div className="flex gap-2">
                <Select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} aria-label="Technician">
                  <option value="">Select technician</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {person.department}
                    </option>
                  ))}
                </Select>
                <Button size="sm" className="shrink-0" disabled={busy || !assigneeId || assigneeId === ticket.assigneeId} onClick={() => update(undefined, assigneeId)}>
                  {ticket.assigneeId ? "Reassign" : "Assign"}
                </Button>
              </div>
            ) : null}
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Progress or resolution note (required to reject, escalate or put on hold)" />
            {me.role === "TECHNICIAN" && !ticket.assigneeId ? (
              <Button size="sm" disabled={busy} onClick={takeTicket}>
                Take ticket
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {opsActions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "RESOLVED" ? "primary" : status === "REJECTED" ? "danger" : "secondary"}
                  disabled={busy}
                  onClick={() => update(status)}
                >
                  {ticket.status === "ON_HOLD" && status === "IN_PROGRESS" ? "Resume work" : ACTION_LABELS[status]}
                </Button>
              ))}
            </div>
            {opsActions.length === 0 && !(canAssign(me) && assignable) ? (
              <p className="text-xs text-[var(--muted)]">No operational actions are available at this stage.</p>
            ) : null}
          </Card>
        ) : null}
        {owner && ticket.status === "RESOLVED" ? (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold">Has this issue been resolved?</h2>
            <label className="text-sm">
              Rating
              <Select value={String(rating)} onChange={(event) => setRating(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 5 ? "— excellent" : value === 1 ? "— poor" : ""}
                  </option>
                ))}
              </Select>
            </label>
            <Textarea rows={2} value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} placeholder="Optional comment" />
            <Button disabled={busy} onClick={() => update("CLOSED")}>
              Yes, close complaint
            </Button>
            <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="If not resolved, explain why" />
            <Button variant="danger" disabled={busy || reason.trim().length < 4} onClick={() => update("REOPENED")}>
              No, reopen complaint
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
