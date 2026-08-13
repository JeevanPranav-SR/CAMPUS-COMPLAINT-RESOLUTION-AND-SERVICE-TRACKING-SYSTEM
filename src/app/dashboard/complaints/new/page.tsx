"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CampusMap from "@/components/map/CampusMap";
import { CAMPUS_LOCATIONS, nearestLocation, type CampusLocation } from "@/lib/campus";
import { CATEGORIES, PRIORITIES, slaHours, type Priority } from "@/lib/constants";

export default function NewComplaintPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [location, setLocation] = useState<CampusLocation>(CAMPUS_LOCATIONS[2]);
  const [pick, setPick] = useState({ lat: location.lat, lng: location.lng });
  const [landmark, setLandmark] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hours = slaHours(category, priority);
  const unit = useMemo(
    () => CATEGORIES.find((item) => item.id === category)?.unit,
    [category],
  );

  function chooseLocation(next: CampusLocation) {
    setLocation(next);
    setPick({ lat: next.lat, lng: next.lng });
  }

  function handlePick(lat: number, lng: number) {
    setPick({ lat, lng });
    setLocation(nearestLocation(lat, lng));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category,
        priority,
        locationId: location.id,
        lat: pick.lat,
        lng: pick.lng,
        landmark,
      }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Could not file ticket");
      return;
    }
    router.push(`/dashboard/complaints/${payload.complaint.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Geo-tagged intake</p>
        <h1 className="font-display text-4xl">File a campus issue</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Drop a pin on the BIT map. NEXUS snaps it to the nearest facility and routes it to {unit}.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short fault title"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />
          <textarea
            required
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is broken, who is affected, and when it started."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
            >
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
            >
              {PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <select
            value={location.id}
            onChange={(event) => {
              const next = CAMPUS_LOCATIONS.find((item) => item.id === event.target.value);
              if (next) chooseLocation(next);
            }}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
          >
            {CAMPUS_LOCATIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
            placeholder="Landmark — floor, room, wing…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
            Snapped to <strong>{location.name}</strong>. SLA window {hours}h · {unit}.
            <div className="mt-1 font-mono text-[11px] text-cyan-300/80">
              {pick.lat.toFixed(6)}°N {pick.lng.toFixed(6)}°E
            </div>
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            disabled={busy}
            className="w-full rounded-2xl bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950"
          >
            {busy ? "Filing…" : "Submit ticket"}
          </button>
        </div>
        <div className="h-[640px]">
          <CampusMap
            pickMode
            pick={pick}
            onPick={handlePick}
            onSelectLocation={chooseLocation}
            focus={[pick.lat, pick.lng]}
            showLocations
          />
        </div>
      </form>
    </div>
  );
}
