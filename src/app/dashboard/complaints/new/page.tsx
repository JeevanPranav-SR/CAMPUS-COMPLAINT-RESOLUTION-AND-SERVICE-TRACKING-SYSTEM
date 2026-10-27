"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CampusMap from "@/components/map/CampusMap";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { CAMPUS_LOCATIONS, nearestLocation, type CampusLocation } from "@/lib/campus";
import { api } from "@/lib/client";
import { CLASSIFY_EXAMPLES } from "@/lib/classify";
import { CATEGORIES, PRIORITIES, slaHours, type Priority } from "@/lib/constants";
import { departmentName, routeComplaint } from "@/lib/routing";
import { specialtyLabel } from "@/lib/specialties";
import type { Ticket } from "@/lib/types";

type AiSuggestion = {
  category: string;
  predicted_category: string;
  unit: string;
  priority: Priority;
  confidence: number;
  assigned_worker_name: string | null;
  explanation: string;
  department_name: string;
};

type SimilarMatch = {
  id: string | null;
  ticketNo: string | null;
  title: string | null;
  mine: boolean;
  status: string;
  place: string;
  department: string;
  distanceMeters: number;
  ageHours: number;
};

type SimilarPayload = {
  category: string;
  radiusMeters: number;
  windowDays: number;
  openCount: number;
  recentlyFixed: number;
  recurring: boolean;
  matches: SimilarMatch[];
};

function ageLabel(hours: number) {
  if (hours < 1) return "just now";
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export default function NewComplaintPage() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ELECTRICAL");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [location, setLocation] = useState<CampusLocation>(CAMPUS_LOCATIONS[2]);
  const [pick, setPick] = useState<{ lat: number; lng: number } | null>(null);
  const [landmark, setLandmark] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [created, setCreated] = useState<(Ticket & { departmentName?: string }) | null>(null);
  const [similar, setSimilar] = useState<SimilarPayload | null>(null);

  const hours = slaHours(category, priority);
  const unit = useMemo(() => CATEGORIES.find((item) => item.id === category)?.unit, [category]);
  const routedTo = departmentName(routeComplaint(category, location.id));

  useEffect(() => {
    if (!pick) return;
    let active = true;
    const timer = window.setTimeout(() => {
      api<SimilarPayload>(`/api/complaints/similar?category=${category}&lat=${pick.lat}&lng=${pick.lng}`)
        .then((payload) => {
          if (active) setSimilar(payload);
        })
        .catch(() => {
          if (active) setSimilar(null);
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [category, pick]);

  function handlePick(lat: number, lng: number) {
    setPick({ lat, lng });
    setLocation(nearestLocation(lat, lng));
  }

  async function onFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 1_200_000) {
      setError("Image must be under 1.2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEvidence(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function suggestFromText(text = description) {
    if (text.trim().length < 5) {
      setError("Write a short description first so AI can classify it.");
      return;
    }
    setAiBusy(true);
    setError("");
    try {
      const payload = await api<AiSuggestion>("/api/ai/classify", {
        method: "POST",
        body: JSON.stringify({ complaint_text: text, location: landmark || location.name, location_id: location.id }),
      });
      setSuggestion(payload);
      setCategory(payload.category);
      setPriority(payload.priority);
      toast(`AI suggested ${payload.predicted_category}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to classify");
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!pick) {
      setError("Pin the issue on the campus map.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = await api<{ complaint: Ticket & { departmentName?: string } }>("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          locationId: location.id,
          lat: pick.lat,
          lng: pick.lng,
          landmark,
          evidence: evidence || undefined,
        }),
      });
      setCreated(payload.complaint);
      toast("Complaint submitted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="text-sm font-medium text-emerald-700">Complaint submitted successfully.</p>
        <h1 className="mt-2 text-2xl font-semibold">{created.ticketNo}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{created.title}</p>
        <p className="mt-4 text-sm">
          Automatically routed to <span className="font-medium">{created.departmentName ?? routedTo}</span>. SLA window: {created.slaHours} hours.
        </p>
        {created.assignee?.name ? (
          <p className="mt-2 text-sm">
            AI assigned <span className="font-medium">{created.assignee.name}</span>
            {created.assignee.specialty ? ` (${specialtyLabel(created.assignee.specialty).toLowerCase()})` : ""}
            {typeof created.assignee.experienceYears === "number" && created.assignee.experienceYears > 0
              ? ` with ${created.assignee.experienceYears} years of experience`
              : ""}
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">A department head will assign a technician shortly.</p>
        )}
        <p className="mt-1 text-xs text-[var(--muted)]">Keep this reference ID. You will be notified on every status change.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/dashboard/complaints/${created.id}`}>
            <Button>Track complaint</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Report an issue"
        description="Describe the problem in your own words. AI classifies it, routes it to the right department, and auto-assigns a technician by trade, experience and current workload."
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold">Issue details</h2>
            <Field label="Title" hint="8–120 characters">
              <Input required minLength={8} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" hint="What is broken, who is affected, and when it started.">
              <Textarea required minLength={20} maxLength={2000} rows={5} value={description} onChange={(event) => { setDescription(event.target.value); setSuggestion(null); }} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {CLASSIFY_EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:bg-slate-50"
                  onClick={() => {
                    setDescription(example.text);
                    setSuggestion(null);
                    void suggestFromText(example.text);
                  }}
                >
                  {example.label}
                </button>
              ))}
            </div>
            <Button type="button" variant="secondary" disabled={aiBusy} onClick={() => suggestFromText()}>
              {aiBusy ? "Classifying…" : "Suggest category"}
            </Button>
            {suggestion ? (
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
                <p className="font-medium">AI suggested {suggestion.predicted_category}</p>
                <p className="mt-1 text-[var(--muted)]">{suggestion.explanation}</p>
                {suggestion.assigned_worker_name ? (
                  <p className="mt-1 text-xs">AI will auto-assign: {suggestion.assigned_worker_name}</p>
                ) : null}
              </div>
            ) : null}
            <Field label="Priority">
              <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-sm font-semibold">Location</h2>
            <Field label="Building / facility">
              <Select
                value={location.id}
                onChange={(event) => {
                  const next = CAMPUS_LOCATIONS.find((item) => item.id === event.target.value);
                  if (next) {
                    setLocation(next);
                    setPick({ lat: next.lat, lng: next.lng });
                  }
                }}
              >
                {CAMPUS_LOCATIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Room / block / landmark">
              <Input value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="Floor, room, wing" />
            </Field>
            <p className="text-sm text-[var(--muted)]">
              {pick ? `Pinned near ${location.name} · ${unit} · SLA ${hours}h` : "Tap the map to drop a pin."}
            </p>
            <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
              <span className="text-[var(--muted)]">Auto-routing: </span>
              <span className="font-medium">{routedTo} department</span>
            </div>
          </Card>
          {similar && (similar.openCount > 0 || similar.recurring) ? (
            <Card className="space-y-2 border-amber-300 bg-amber-50/60">
              <h2 className="text-sm font-semibold text-amber-900">
                {similar.openCount > 0
                  ? `${similar.openCount} open ${similar.category.toLowerCase()} complaint${similar.openCount > 1 ? "s" : ""} within ${similar.radiusMeters} m`
                  : `Repeat problem: ${similar.recentlyFixed} ${similar.category.toLowerCase()} fix${similar.recentlyFixed > 1 ? "es" : ""} here in the last ${similar.windowDays} days`}
              </h2>
              <p className="text-xs text-amber-900/80">
                {similar.openCount > 0
                  ? "This may already be reported. You can still file it, since more reports raise its visibility to the department."
                  : "File it anyway. Repeat failures are flagged to the department for a root-cause repair."}
              </p>
              <ul className="space-y-1.5">
                {similar.matches.map((match, index) => (
                  <li key={match.id ?? index} className="rounded border border-amber-200 bg-white px-2.5 py-1.5 text-xs">
                    {match.id ? (
                      <Link href={`/dashboard/complaints/${match.id}`} className="font-medium text-[var(--primary)] hover:underline">
                        {match.ticketNo} · {match.title}
                      </Link>
                    ) : (
                      <span className="font-medium">Reported by another user</span>
                    )}
                    <p className="text-[var(--muted)]">
                      {match.status} · {match.department} · {match.place} · {match.distanceMeters} m away · {ageLabel(match.ageHours)}
                      {match.mine ? " · your complaint" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card>
            <Field label="Photo (optional)" hint="JPEG, PNG or WebP, max 1.2 MB">
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFile(event.target.files?.[0])} />
            </Field>
          </Card>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button disabled={busy} className="w-full">
            {busy ? "Submitting…" : "Submit complaint"}
          </Button>
        </div>
        <div className="h-[620px]">
          <CampusMap pickMode pick={pick} onPick={handlePick} onSelectLocation={(item) => { setLocation(item); setPick({ lat: item.lat, lng: item.lng }); }} focus={pick ? [pick.lat, pick.lng] : null} />
        </div>
      </form>
    </div>
  );
}
