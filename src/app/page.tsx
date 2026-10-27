import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLockup, SiteFooter } from "@/components/brand/SiteFooter";

const capabilities = [
  { title: "Report", copy: "Every authenticated campus member can pin an issue on the BIT map with category, priority and evidence." },
  { title: "Track", copy: "Every ticket has a lifecycle, SLA clock, comments and a verifiable timeline." },
  { title: "Resolve", copy: "Auto-routed to IT, Electrical, Facilities or Hostel teams. Department heads assign technicians. Super Admin oversees campus." },
  { title: "Improve", copy: "Analytics track resolution speed, department response rates, repeat failures and user ratings." },
];

const differentiators = [
  { title: "Pinned on the real campus map", copy: "Complaints are geo-tagged to BIT buildings from OpenStreetMap, so hotspots show up on a map, not just in a list." },
  { title: "Duplicate-aware reporting", copy: "Before you submit, BIT NEXUS shows the same issue already open within 150 m, without revealing who reported it." },
  { title: "Reporter verifies the fix", copy: "A ticket only closes when the reporter confirms and rates the fix. Otherwise it reopens with a fresh SLA clock." },
  { title: "Repeat-failure detection", copy: "The same fault at the same place is flagged to the department for a root-cause repair instead of another quick patch." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <BrandLockup href="/" />
        <div className="flex shrink-0 gap-3">
          <Link href="/login"><Button variant="secondary">Sign in</Button></Link>
          <Link href="/register"><Button>Register</Button></Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <p className="text-sm font-medium text-[var(--accent)]">Bannari Amman Institute of Technology · Sathyamangalam</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          One platform for every campus service issue.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Report. Track. Resolve. Improve. A role-based operations system for electrical, plumbing, hostel, Wi-Fi and facilities work across the 181-acre campus.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login"><Button>Enter platform</Button></Link>
          <Link href="/register"><Button variant="secondary">Student / faculty sign-up</Button></Link>
        </div>
        <section className="mt-16 grid gap-4 md:grid-cols-4">
          {capabilities.map((item) => (
            <article key={item.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.copy}</p>
            </article>
          ))}
        </section>
        <section className="mt-12">
          <h2 className="text-lg font-semibold">What makes BIT NEXUS different</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {differentiators.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
