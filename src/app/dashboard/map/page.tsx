"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CampusMap from "@/components/map/CampusMap";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { api } from "@/lib/client";
import { CATEGORIES } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import { remainingLabel } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

type Filter = "ALL" | "OPEN" | "HIGH" | "OVERDUE" | "RESOLVED";

export default function MapPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    api<{ complaints: Ticket[] }>("/api/complaints?pageSize=100")
      .then((payload) => {
        setTickets(payload.complaints);
        setNow(Date.now());
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    return tickets.filter((ticket) => {
      if (category && ticket.category !== category) return false;
      if (filter === "OPEN") return !["RESOLVED", "CLOSED"].includes(ticket.status);
      if (filter === "HIGH") return ticket.priority === "HIGH" || ticket.priority === "CRITICAL";
      if (filter === "OVERDUE") return !["RESOLVED", "CLOSED"].includes(ticket.status) && new Date(ticket.dueAt).getTime() < now;
      if (filter === "RESOLVED") return ticket.status === "RESOLVED" || ticket.status === "CLOSED";
      return true;
    });
  }, [tickets, filter, category, now]);

  const active = tickets.find((item) => item.id === selected);
  const open = visible.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
  const overdue = open.filter((item) => new Date(item.dueAt).getTime() < now);
  const high = open.filter((item) => item.priority === "HIGH" || item.priority === "CRITICAL");

  if (loading) return <Skeleton className="h-[70vh]" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Campus map" description="Operational GIS for BIT Sathy. Pins are live complaints, not decoration." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "OPEN", "HIGH", "OVERDUE", "RESOLVED"] as Filter[]).map((item) => (
          <Button key={item} size="sm" variant={filter === item ? "primary" : "secondary"} onClick={() => setFilter(item)}>
            {item === "ALL" ? "All" : item === "OPEN" ? "Open" : item === "HIGH" ? "High priority" : item === "OVERDUE" ? "Overdue" : "Resolved"}
          </Button>
        ))}
        <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-auto">
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="h-[70vh] min-h-[480px]">
          <CampusMap tickets={visible} selectedId={selected} onSelectTicket={setSelected} />
        </div>
        <aside className="space-y-3">
          <Card>
            <p className="text-sm font-medium">{open.length} open complaints in this view</p>
            <p className="text-sm text-[var(--muted)]">{overdue.length} overdue · {high.length} high priority</p>
          </Card>
          {active ? (
            <Link href={`/dashboard/complaints/${active.id}`}>
              <Card>
                <p className="font-mono text-xs text-[var(--accent)]">{active.ticketNo}</p>
                <p className="mt-1 font-medium">{active.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{getLocation(active.locationId)?.name}</p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge status={active.status} />
                  <PriorityBadge priority={active.priority} />
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{remainingLabel(active.dueAt, active.status, active.resolvedAt)}</p>
              </Card>
            </Link>
          ) : (
            <p className="text-sm text-[var(--muted)]">Select a pin to preview a complaint.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
