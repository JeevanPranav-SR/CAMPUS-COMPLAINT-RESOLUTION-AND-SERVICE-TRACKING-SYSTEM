"use client";

import { useMemo, useState } from "react";
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
import type { Ticket } from "@/lib/types";

type AiSuggestion = {
  category: string;
  predicted_category: string;
  unit: string;
  priority: Priority;
  confidence: number;
  assigned_worker_name: string | null;
  explanation: string;
};

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
  const [created, setCreated] = useState<Ticket | null>(null);

  const hours = slaHours(category, priority);
  const unit = useMemo(() => CATEGORIES.find((item) => item.id === category)?.unit, [category]);

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
        body: JSON.stringify({ complaint_text: text, location: landmark || location.name }),
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
      const payload = await api<{ complaint: Ticket }>("/api/complaints", {
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
        <p className="mt-4 text-sm">SLA window: {created.slaHours} hours from submission.</p>
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
        description="Describe the problem in your own words. AI can suggest a category and the right campus unit. Then pin the place on the map."
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
                  <p className="mt-1 text-xs">Suggested staff: {suggestion.assigned_worker_name}</p>
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
              {pick ? `Pinned near ${location.name} · routed to ${unit} · SLA ${hours}h` : "Tap the map to drop a pin."}
            </p>
          </Card>
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
