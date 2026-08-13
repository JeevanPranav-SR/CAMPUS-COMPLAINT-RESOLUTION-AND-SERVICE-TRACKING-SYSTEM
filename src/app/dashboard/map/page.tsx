"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CampusMap from "@/components/map/CampusMap";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { CAMPUS_LOCATIONS, CAMPUS_ZONES, type CampusLocation } from "@/lib/campus";
import type { Ticket } from "@/lib/types";

export default function MapPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [openOnly, setOpenOnly] = useState(true);

  useEffect(() => {
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((payload) => setTickets(payload.complaints ?? []));
  }, []);

  const visibleTickets = tickets.filter((ticket) =>
    openOnly ? !["RESOLVED", "CLOSED"].includes(ticket.status) : true,
  );
  const locations = useMemo(
    () =>
      CAMPUS_LOCATIONS.filter((item) =>
        `${item.name} ${item.shortName} ${item.kind}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  const active = tickets.find((item) => item.id === selected);

  function flyToLocation(location: CampusLocation) {
    setFocus([location.lat, location.lng]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Geospatial ops</p>
          <h1 className="font-display text-4xl">BIT campus map</h1>
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
          <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} />
          Open tickets only
        </label>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="h-[70vh] min-h-[520px]">
          <CampusMap
            tickets={visibleTickets}
            selectedId={selected}
            onSelectTicket={setSelected}
            onSelectLocation={flyToLocation}
            focus={focus}
          />
        </div>
        <aside className="space-y-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Learning Centre, Sapphire, Data Centre…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {CAMPUS_ZONES.map((zone) => (
              <span key={zone.id} className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: zone.color }} />
                {zone.label}
              </span>
            ))}
          </div>
          {active ? (
            <Link href={`/dashboard/complaints/${active.id}`} className="glass block rounded-3xl p-4">
              <p className="font-mono text-[11px] text-cyan-300">{active.ticketNo}</p>
              <p className="mt-2 font-medium">{active.title}</p>
              <div className="mt-3 flex gap-2">
                <StatusBadge status={active.status} />
                <PriorityBadge priority={active.priority} />
              </div>
            </Link>
          ) : null}
          <div className="max-h-[46vh] space-y-2 overflow-auto pr-1">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => flyToLocation(location)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:border-cyan-300/30"
              >
                <p className="text-sm">{location.shortName}</p>
                <p className="text-[11px] text-slate-500">
                  {location.kind} · {location.source === "osm" ? "OSM" : "layout"}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
