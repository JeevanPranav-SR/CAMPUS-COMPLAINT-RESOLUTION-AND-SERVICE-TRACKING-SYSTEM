"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { CATEGORIES, STATUSES } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";
import { formatRelative, remainingLabel } from "@/lib/utils";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((payload) => setTickets(payload.complaints ?? []));
  }, []);

  const filtered = useMemo(
    () =>
      tickets.filter((ticket) => {
        const hay = `${ticket.ticketNo} ${ticket.title} ${ticket.description}`.toLowerCase();
        return (
          (status === "ALL" || ticket.status === status) &&
          (category === "ALL" || ticket.category === category) &&
          hay.includes(query.toLowerCase())
        );
      }),
    [tickets, query, status, category],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Service ledger</p>
          <h1 className="font-display text-4xl">Tickets</h1>
        </div>
        <Link
          href="/dashboard/complaints/new"
          className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
        >
          File issue
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ticket, building, fault…"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm"
        >
          <option value="ALL">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">SLA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr key={ticket.id} className="border-t border-white/8 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">
                  <Link href={`/dashboard/complaints/${ticket.id}`}>{ticket.ticketNo}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-xs text-slate-500">{formatRelative(ticket.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{getLocation(ticket.locationId)?.shortName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{remainingLabel(ticket.dueAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
