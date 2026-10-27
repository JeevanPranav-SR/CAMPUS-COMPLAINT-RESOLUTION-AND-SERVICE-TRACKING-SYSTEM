"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Star } from "lucide-react";
import { ClientGuard, useUser } from "@/components/auth/guards";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui/card";
import { api } from "@/lib/client";
import { CATEGORIES, STATUS_META, type Status } from "@/lib/constants";
import type { StatsPayload } from "@/lib/types";

const TREND_COLORS = ["#16345a", "#1d4ed8", "#b45309", "#0f766e"];

function hoursLabel(hours: number) {
  if (!hours) return "—";
  return hours >= 48 ? `${(hours / 24).toFixed(1)} d` : `${hours} h`;
}

function Meter({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-600" : value >= 50 ? "bg-amber-500" : "bg-red-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-slate-200">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular-nums">{value}%</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const user = useUser();
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
    <ClientGuard any={["analytics:view", "analytics:view_department"]}>
    <div>
      <PageHeader
        title={user?.role === "SUPER_ADMIN" ? "Campus analytics" : "Department analytics"}
        description={
          user?.role === "SUPER_ADMIN"
            ? "Resolution speed, recurring issues, department response rates and user feedback across campus."
            : `Metrics for complaints routed to ${user?.department ?? "your department"}.`
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total complaints", stats.totals.all],
          ["Open", stats.totals.open],
          ["Resolved", stats.totals.resolved],
          ["Overdue", stats.totals.breached],
          ["SLA compliance", `${stats.totals.slaCompliance}%`],
          ["Avg first response", hoursLabel(stats.speed.avgFirstResponseHours)],
          ["Median resolution", hoursLabel(stats.speed.medianResolutionHours)],
          ["Avg rating", stats.feedback.count ? `${stats.feedback.average} / 5` : "—"],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </section>
      <section className="mt-6">
        <h2 className="text-base font-semibold">Department response rates</h2>
        <p className="text-sm text-[var(--muted)]">How quickly each operational department picks up and closes the complaints routed to it.</p>
        {stats.departments.length === 0 ? (
          <EmptyState title="No routed complaints yet" description="Department metrics appear once complaints are filed." />
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
                <tr>
                  {["Department", "Tickets", "Open", "Responded", "Within 24 h", "Avg response", "Resolved", "Avg resolution", "SLA met", "Rating"].map((col) => (
                    <th key={col} className="px-4 py-2 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.departments.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 tabular-nums">{row.total}</td>
                    <td className="px-4 py-3 tabular-nums">{row.open}</td>
                    <td className="px-4 py-3"><Meter value={row.responseRate} /></td>
                    <td className="px-4 py-3"><Meter value={row.respondedWithin24h} /></td>
                    <td className="px-4 py-3 tabular-nums">{hoursLabel(row.avgResponseHours)}</td>
                    <td className="px-4 py-3"><Meter value={row.resolutionRate} /></td>
                    <td className="px-4 py-3 tabular-nums">{hoursLabel(row.avgResolutionHours)}</td>
                    <td className="px-4 py-3 tabular-nums">{row.resolved ? `${row.slaCompliance}%` : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{row.ratings ? `${row.avgRating} ★ (${row.ratings})` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">Resolution speed</h2>
          <p className="text-xs text-[var(--muted)]">
            Average {hoursLabel(stats.speed.avgResolutionHours)} · median {hoursLabel(stats.speed.medianResolutionHours)} from filing to fix.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.speed.buckets}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Resolved tickets" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">User feedback ratings</h2>
          <p className="text-xs text-[var(--muted)]">
            {stats.feedback.count
              ? `${stats.feedback.average} / 5 from ${stats.feedback.count} verified closures (${stats.feedback.responseRate}% of closed tickets rated).`
              : "Reporters rate the fix when they verify and close a ticket."}
          </p>
          <div className="mt-4 space-y-2">
            {stats.feedback.distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-sm">
                <span className="flex w-10 items-center gap-1 tabular-nums">
                  {row.stars} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                </span>
                <div className="h-2 flex-1 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-amber-400"
                    style={{ width: `${stats.feedback.count ? (row.count / stats.feedback.count) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums text-[var(--muted)]">{row.count}</span>
              </div>
            ))}
          </div>
          {stats.feedback.recent.length ? (
            <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
              {stats.feedback.recent.map((item) => (
                <li key={item.ticketNo} className="text-sm">
                  <p className="text-slate-700">“{item.comment}”</p>
                  <p className="text-xs text-[var(--muted)]">{item.rating} ★ · {item.category} · {item.ticketNo}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Recurring issue trends</h2>
          <p className="text-xs text-[var(--muted)]">Weekly complaints for the four most frequent categories (last 8 weeks).</p>
          {stats.trend.categories.length === 0 ? (
            <EmptyState title="Not enough data" description="Not enough data to display this metric." />
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trend.weeks}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {stats.trend.categories.map((name, index) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={TREND_COLORS[index]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Repeat failures</h2>
          <p className="text-xs text-[var(--muted)]">Same problem at the same place in the last 90 days, or fixes that were reopened. Candidates for root-cause repair.</p>
          {stats.recurring.length === 0 ? (
            <EmptyState title="No repeat failures" description="No location has the same issue reported more than once." />
          ) : (
            <div className="mt-3 space-y-2">
              {stats.recurring.map((item) => (
                <div key={`${item.location}-${item.category}`} className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{item.category} · {item.location}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.open} open · {item.reopened} reopened · last {new Date(item.lastAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{item.count}×</p>
                </div>
              ))}
            </div>
          )}
        </Card>
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
        <h2 className="text-base font-semibold">Technician workload</h2>
        <p className="text-sm text-[var(--muted)]">Identify overloaded maintenance technicians before SLA breaches pile up.</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--bg)] text-xs text-[var(--muted)]">
              <tr>
                {["Technician", "Department", "Assigned", "In progress", "Resolved", "Overdue", "Avg hours"].map((col) => (
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
    </ClientGuard>
  );
}
