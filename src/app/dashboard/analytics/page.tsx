"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { api } from "@/lib/client";
import { CATEGORIES, STATUS_META, type Status } from "@/lib/constants";
import type { StatsPayload } from "@/lib/types";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<StatsPayload>("/api/stats")
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <Skeleton className="h-96" />;

  const categoryData = CATEGORIES.map((item) => ({ name: item.label, count: stats.byCategory[item.id] ?? 0 })).filter((item) => item.count);
  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({ name: STATUS_META[status as Status]?.label ?? status, count }));

  return (
    <div>
      <PageHeader title="Analytics" description="Operational metrics from live complaint data." />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total complaints", stats.totals.all],
          ["Open", stats.totals.open],
          ["Resolved", stats.totals.resolved],
          ["Overdue", stats.totals.breached],
          ["SLA compliance", `${stats.totals.slaCompliance}%`],
          ["Avg resolution", `${stats.totals.avgResolution}h`],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">Complaints by category</h2>
          <p className="text-xs text-[var(--muted)]">Where campus services are failing most often.</p>
          {categoryData.length === 0 ? (
            <EmptyState title="Not enough data" description="Not enough data to display this metric." />
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16345a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <p className="text-xs text-[var(--muted)]">Current distribution across the lifecycle.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Complaints by priority</h2>
          <p className="text-xs text-[var(--muted)]">How urgent the current caseload is.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(stats.byPriority).map(([name, count]) => ({ name, count }))}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#b45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Complaints over time</h2>
          <p className="text-xs text-[var(--muted)]">Last 14 days of submissions.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byDay}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Location hotspots</h2>
          <p className="text-xs text-[var(--muted)]">Open volume by facility.</p>
          <div className="mt-3 space-y-2">
            {stats.hotspots.map((spot) => (
              <div key={spot.id} className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{spot.name}</p>
                  <p className="text-xs text-[var(--muted)]">{spot.open} open · {spot.overdue} overdue · {spot.high} high</p>
                </div>
                <p className="font-semibold">{spot.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <section className="mt-6">
        <h2 className="text-base font-semibold">Staff workload</h2>
        <p className="text-sm text-[var(--muted)]">Identify overloaded field staff before SLA breaches pile up.</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
              <tr>
                {["Staff", "Department", "Assigned", "In progress", "Resolved", "Overdue", "Avg hours"].map((col) => (
                  <th key={col} className="px-4 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.workload.map((person) => (
                <tr key={person.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">{person.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{person.department}</td>
                  <td className="px-4 py-3">{person.assigned}</td>
                  <td className="px-4 py-3">{person.inProgress}</td>
                  <td className="px-4 py-3">{person.resolved}</td>
                  <td className="px-4 py-3">{person.overdue}</td>
                  <td className="px-4 py-3">{person.avgHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
