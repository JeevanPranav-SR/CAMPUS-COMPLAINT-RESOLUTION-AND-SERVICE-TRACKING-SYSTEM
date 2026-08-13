"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { getLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";
import { remainingLabel } from "@/lib/utils";

const COLUMNS = ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"] as const;

export default function OperationsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [scope, setScope] = useState("all");

  useEffect(() => {
    fetch(`/api/complaints?scope=${scope === "assigned" ? "assigned" : "default"}`)
      .then((res) => res.json())
      .then((payload) => setTickets(payload.complaints ?? []));
  }, [scope]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((column) => [column, tickets.filter((ticket) => ticket.status === column)]),
      ) as Record<(typeof COLUMNS)[number], Ticket[]>,
    [tickets],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Field operations</p>
          <h1 className="font-display text-4xl">Crew board</h1>
        </div>
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm"
        >
          <option value="all">Campus queue</option>
          <option value="assigned">Assigned to me</option>
        </select>
      </div>
      <div className="grid gap-3 overflow-x-auto pb-4 lg:grid-cols-5">
        {COLUMNS.map((column) => (
          <section key={column} className="min-w-[240px] rounded-[28px] border border-white/10 bg-white/4 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                {column.replace(/_/g, " ")}
              </h2>
              <span className="text-xs text-cyan-300">{grouped[column].length}</span>
            </div>
            <div className="space-y-3">
              {grouped[column].map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/complaints/${ticket.id}`}
                  className="block rounded-2xl border border-white/10 bg-[#070b14] p-3"
                >
                  <p className="font-mono text-[10px] text-cyan-300">{ticket.ticketNo}</p>
                  <p className="mt-1 text-sm">{ticket.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{getLocation(ticket.locationId)?.shortName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">{remainingLabel(ticket.dueAt)}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
