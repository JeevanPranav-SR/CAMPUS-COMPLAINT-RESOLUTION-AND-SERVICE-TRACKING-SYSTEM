"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CampusMap from "@/components/map/CampusMap";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { CATEGORIES, nextStatuses, STATUS_META, type Role, type Status } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";
import { formatDateTime, remainingLabel, slaState } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

type Staff = { id: string; name: string; department: string | null; role: string };

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [note, setNote] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [ticketRes, meRes] = await Promise.all([
      fetch(`/api/complaints/${params.id}`),
      fetch("/api/auth/me"),
    ]);
    const ticketPayload = await ticketRes.json();
    const mePayload = await meRes.json();
    setTicket(ticketPayload.complaint);
    setStaff(ticketPayload.staff ?? []);
    setMe(mePayload.user);
    setAssigneeId(ticketPayload.complaint?.assigneeId ?? "");
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function update(status?: Status) {
    if (!ticket) return;
    setBusy(true);
    await fetch(`/api/complaints/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        assigneeId: assigneeId || undefined,
        note,
      }),
    });
    setNote("");
    setBusy(false);
    await load();
  }

  if (!ticket || !me) {
    return <p className="text-slate-400">Loading ticket telemetry…</p>;
  }

  const location = getLocation(ticket.locationId);
  const unit = CATEGORIES.find((item) => item.id === ticket.category)?.unit;
  const allowed = nextStatuses(ticket.status as Status, me.role as Role);
  const sla = slaState(ticket.dueAt, ticket.status);
  const steps = ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <div>
          <p className="font-mono text-xs text-cyan-300">{ticket.ticketNo}</p>
          <h1 className="mt-1 font-display text-4xl">{ticket.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              {sla === "breached" ? "SLA breached" : remainingLabel(ticket.dueAt)}
            </span>
          </div>
        </div>
        <p className="text-sm leading-7 text-slate-300">{ticket.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="glass rounded-2xl p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Facility</dt>
            <dd className="mt-1">{location?.name}</dd>
          </div>
          <div className="glass rounded-2xl p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Owning unit</dt>
            <dd className="mt-1">{unit}</dd>
          </div>
          <div className="glass rounded-2xl p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reporter</dt>
            <dd className="mt-1">{ticket.reporter?.name}</dd>
          </div>
          <div className="glass rounded-2xl p-4">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Assignee</dt>
            <dd className="mt-1">{ticket.assignee?.name ?? "Unassigned"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const current = STATUS_META[ticket.status as Status]?.step ?? 1;
            const active = index + 1 <= current;
            return (
              <div
                key={step}
                className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
                  active ? "bg-cyan-300/15 text-cyan-200" : "bg-white/5 text-slate-500"
                }`}
              >
                {index + 1} {step.replace(/_/g, " ")}
              </div>
            );
          })}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-2xl">Tracking log</h2>
          {(ticket.events ?? []).map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
              <div>
                <p className="text-sm">
                  {event.note}{" "}
                  <span className="text-slate-500">· {event.actor?.name ?? "System"}</span>
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="glass space-y-3 rounded-3xl p-4">
          <h3 className="font-display text-xl">Advance ticket</h3>
          {["STAFF", "WARDEN", "ADMIN"].includes(me.role) ? (
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm"
            >
              <option value="">Assign crew…</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.department}
                </option>
              ))}
            </select>
          ) : null}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Field note / resolution remark"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {["STAFF", "WARDEN", "ADMIN"].includes(me.role) ? (
              <button
                disabled={busy}
                onClick={() => update()}
                className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.16em]"
              >
                Save assignment
              </button>
            ) : null}
            {allowed.map((status) => (
              <button
                key={status}
                disabled={busy}
                onClick={() => update(status)}
                className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
              >
                Mark {status.replace(/_/g, " ").toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[640px]">
        <CampusMap
          tickets={[ticket]}
          selectedId={ticket.id}
          focus={[ticket.lat, ticket.lng]}
        />
      </div>
    </div>
  );
}
