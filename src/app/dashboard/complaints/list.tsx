"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { api } from "@/lib/client";
import { CATEGORIES, PRIORITY_META, STATUS_META, STATUSES, PRIORITIES, categoryLabel } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import { departmentName, routeComplaint } from "@/lib/routing";
import { formatDateTime, remainingLabel } from "@/lib/utils";
import { can } from "@/lib/rbac";
import { useUser } from "@/components/auth/guards";
import type { Ticket } from "@/lib/types";

export default function ComplaintsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const category = searchParams.get("category") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const scope = searchParams.get("scope") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const [draftQ, setDraftQ] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setDraftQ(q);
  }
  const me = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function replaceFilters(next: Record<string, string>, nextPage = 1) {
    const params = new URLSearchParams();
    const merged = { q, status, priority, category, from, to, scope, ...next };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.replace(query ? `/dashboard/complaints?${query}` : "/dashboard/complaints");
  }

  useEffect(() => {
    let active = true;
    function load() {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (category) params.set("category", category);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (scope) params.set("scope", scope);
      api<{ complaints: Ticket[]; total: number }>("/api/complaints?" + params.toString())
        .then((payload) => {
          if (!active) return;
          setTickets(payload.complaints);
          setTotal(payload.total);
          setError("");
          setLoading(false);
        })
        .catch((err: Error) => {
          if (!active) return;
          setError(err.message);
          setLoading(false);
        });
    }
    load();
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [q, status, priority, category, from, to, scope, page]);

  const pages = Math.max(1, Math.ceil(total / 12));
  const canCreate = me ? can(me, "complaint:create") : false;
  const activeFilters = Boolean(q || status || priority || category || from || to);
  const title =
    scope === "mine"
      ? "My complaints"
      : scope === "assigned"
        ? "Assigned work"
        : scope === "work"
          ? "Assigned work"
          : scope === "hostel" || scope === "department"
            ? `${me?.department ?? "Department"} complaints`
            : scope === "all"
              ? "All campus complaints"
              : "Complaints";

  return (
    <div>
      <PageHeader
        title={title}
        description="Only complaints in your access scope are listed here."
        actions={
          canCreate ? (
            <Link href="/dashboard/complaints/new">
              <Button>Raise complaint</Button>
            </Link>
          ) : null
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            replaceFilters({ q: draftQ.trim() });
          }}
        >
          <Input value={draftQ} onChange={(event) => setDraftQ(event.target.value)} placeholder="Search ticket or title" aria-label="Search complaints" />
        </form>
        <Select value={status} onChange={(event) => replaceFilters({ status: event.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_META[item].label}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(event) => replaceFilters({ priority: event.target.value })} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {PRIORITY_META[item].label}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(event) => replaceFilters({ category: event.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(event) => replaceFilters({ from: event.target.value })} aria-label="From date" />
        <Input type="date" value={to} onChange={(event) => replaceFilters({ to: event.target.value })} aria-label="To date" />
      </div>
      {activeFilters ? (
        <button className="mb-4 text-sm text-[var(--accent)]" onClick={() => router.replace(scope ? `/dashboard/complaints?scope=${scope}` : "/dashboard/complaints")}>
          Clear filters
        </button>
      ) : null}
      {error ? <ErrorState message={error} onRetry={() => replaceFilters({}, page)} /> : null}
      {loading ? (
        <Skeleton className="h-64" />
      ) : tickets.length === 0 ? (
        <EmptyState title="No complaints found" description="Try a different search or report a new issue." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] md:block">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
                <tr>
                  {["Ticket", "Title", "Category", "Department", "Location", "Priority", "Status", "Technician", "SLA", "Created"].map((col) => (
                    <th key={col} className="px-4 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link className="text-[var(--accent)]" href={`/dashboard/complaints/${ticket.id}`}>
                        {ticket.ticketNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{ticket.title}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{categoryLabel(ticket.category)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{departmentName(routeComplaint(ticket.category, ticket.locationId))}</td>
                    <td className="px-4 py-3">{getLocation(ticket.locationId)?.shortName}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{ticket.assignee?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDateTime(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/dashboard/complaints/${ticket.id}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="font-mono text-xs text-[var(--accent)]">{ticket.ticketNo}</p>
                <p className="mt-1 font-medium">{ticket.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {categoryLabel(ticket.category)} · {getLocation(ticket.locationId)?.shortName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">{remainingLabel(ticket.dueAt, ticket.status, ticket.resolvedAt)}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-[var(--muted)]">{total} results</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => replaceFilters({}, page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => replaceFilters({}, page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
