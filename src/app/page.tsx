import Link from "next/link";
import { Button } from "@/components/ui/button";

const capabilities = [
  { title: "Report", copy: "Students and faculty pin issues on the BIT campus map with category, priority and evidence." },
  { title: "Track", copy: "Every ticket has a lifecycle, SLA clock, comments and a verifiable timeline." },
  { title: "Resolve", copy: "Wardens and estate admin assign staff. Workers update progress until the reporter confirms." },
  { title: "Improve", copy: "Analytics, hotspots and workload views show where campus services keep failing." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-sm font-semibold">BIT Service Ops</p>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="secondary">Sign in</Button></Link>
          <Link href="/register"><Button>Student register</Button></Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-[var(--accent)]">Bannari Amman Institute of Technology · Sathyamangalam</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          One platform for every campus service issue.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Report. Track. Resolve. Improve. A role-based operations system for electrical, plumbing, hostel, Wi-Fi and estate work across the 181-acre campus.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login"><Button>Enter platform</Button></Link>
          <Link href="/register"><Button variant="secondary">Create student account</Button></Link>
        </div>
        <section className="mt-16 grid gap-4 md:grid-cols-4">
          {capabilities.map((item) => (
            <article key={item.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.copy}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
