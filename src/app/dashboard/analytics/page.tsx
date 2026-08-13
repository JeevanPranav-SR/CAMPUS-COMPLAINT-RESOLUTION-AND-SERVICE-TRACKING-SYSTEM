"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, STATUS_META, type Status } from "@/lib/constants";
import type { StatsPayload } from "@/lib/types";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-slate-400">Computing campus telemetry…</p>;

  const categoryData = CATEGORIES.map((item) => ({
    name: item.label,
    count: stats.byCategory[item.id] ?? 0,
  })).filter((item) => item.count > 0);

  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    name: STATUS_META[status as Status]?.label ?? status,
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Intelligence</p>
        <h1 className="font-display text-4xl">Service analytics</h1>
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Total tickets", stats.totals.all],
          ["Open", stats.totals.open],
          ["Closed / resolved", stats.totals.resolved],
          ["Mean close time", `${stats.totals.avgResolution}h`],
        ].map(([label, value]) => (
          <article key={label} className="glass rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl">By service category</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-18} height={70} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl">Pipeline</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="count" fill="#fb7185" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
      <article className="glass rounded-[28px] p-5">
        <h2 className="font-display text-2xl">Campus hotspots</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {stats.hotspots.map((spot, index) => (
            <div key={spot.name} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">#{index + 1}</p>
                <p>{spot.name}</p>
              </div>
              <p className="font-display text-2xl text-cyan-300">{spot.count}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
