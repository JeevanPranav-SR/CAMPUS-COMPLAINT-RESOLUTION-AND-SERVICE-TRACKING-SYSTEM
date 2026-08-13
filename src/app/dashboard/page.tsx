"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CampusMap from "@/components/map/CampusMap";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { getLocation } from "@/lib/campus";
import type { StatsPayload, Ticket } from "@/lib/types";
import { formatRelative, remainingLabel, slaState } from "@/lib/utils";

export default function CommandPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/complaints").then((res) => res.json()),
      fetch("/api/stats").then((res) => res.json()),
    ]).then(([ticketPayload, statsPayload]) => {
      setTickets(ticketPayload.complaints ?? []);
      setStats(statsPayload);
    });
  }, []);

  const live = useMemo(
    () => tickets.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).slice(0, 6),
    [tickets],
  );

  const cards = [
    ["Open tickets", stats?.totals.open ?? "—", "Active on the 181-acre grid"],
    ["SLA risk", stats?.totals.breached ?? "—", "Overdue against category clocks"],
    ["High / critical", stats?.totals.critical ?? "—", "Needs crew now"],
    ["Avg close", stats ? `${stats.totals.avgResolution}h` : "—", "Mean time to resolve"],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Command deck</p>
        <h1 className="mt-1 font-display text-4xl">BIT Sathy service grid</h1>
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        {cards.map(([label, value, hint]) => (
          <article key={label} className="glass rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="h-[520px]">
          <CampusMap tickets={tickets} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Live queue</h2>
            <Link href="/dashboard/complaints" className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              All tickets
            </Link>
          </div>
          {live.map((ticket) => {
            const location = getLocation(ticket.locationId);
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/complaints/${ticket.id}`}
                className="glass block rounded-3xl p-4 transition hover:border-cyan-300/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] text-cyan-300">{ticket.ticketNo}</p>
                  <span className="text-[11px] text-slate-500">{remainingLabel(ticket.dueAt)}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{ticket.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {location?.shortName} · {formatRelative(ticket.createdAt)}
                </p>
                <div className="mt-3 flex gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                {slaState(ticket.dueAt, ticket.status) === "breached" ? (
                  <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-rose-300">SLA breached</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
