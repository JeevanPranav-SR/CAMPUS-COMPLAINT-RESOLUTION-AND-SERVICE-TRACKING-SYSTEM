import Link from "next/link";
import { MapPinned, Radio, Shield, Timer, Waypoints, Workflow } from "lucide-react";
import CampusMap from "@/components/map/CampusMap";
import { CAMPUS_META } from "@/lib/campus";

const features = [
  {
    icon: MapPinned,
    title: "Live campus GIS",
    copy: "OpenStreetMap boundary of BIT Sathy with satellite overlay, 40+ facilities, and pin-drop incident reporting.",
  },
  {
    icon: Workflow,
    title: "Resolution pipeline",
    copy: "Tickets move from submit → acknowledge → assign → field work → verify, with a courier-style timeline.",
  },
  {
    icon: Timer,
    title: "SLA clocks",
    copy: "Category-aware service windows — Wi-Fi in 2 hours, security in 1 hour, civil works on a longer clock.",
  },
  {
    icon: Radio,
    title: "Role-based command",
    copy: "Student, faculty, technician, warden and estate admin each see a different operational surface.",
  },
  {
    icon: Waypoints,
    title: "Hotspot intelligence",
    copy: "Heat glow on the map plus ranked buildings so Estate can see where the campus is actually breaking.",
  },
  {
    icon: Shield,
    title: "BIT-native catalog",
    copy: "Sun Flower Block, Learning Centre, Sapphire–Pearl, Ganga–Bhavani, Vedanayagam, Data Centre, RO, STP.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(225,29,72,0.2),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.16),transparent_30%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-400 font-display text-lg font-bold text-slate-950">
            BIT
          </div>
          <div>
            <p className="font-display text-xl leading-none">NEXUS</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Campus service OS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200">
            Sign in
          </Link>
          <Link href="/register" className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
            Student register
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-rose-300">
              Bannari Amman Institute of Technology · Est. 1996
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
              Campus complaint
              <span className="block bg-gradient-to-r from-cyan-300 via-white to-rose-300 bg-clip-text text-transparent">
                resolution, mapped.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
              A geo-ops layer for the 181-acre Sathyamangalam campus. File an issue on the actual BIT map,
              route it to Electrical, Data Centre, Warden or Estate, and watch the service clock until it is closed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Enter command deck
              </Link>
              <Link
                href="/dashboard/map"
                className="rounded-full border border-cyan-300/40 px-5 py-3 text-sm text-cyan-100"
              >
                Preview campus GIS
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Campus</dt>
                <dd className="mt-1 font-display text-2xl">{CAMPUS_META.acres} ac</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Facilities</dt>
                <dd className="mt-1 font-display text-2xl">40+</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Highway</dt>
                <dd className="mt-1 font-display text-2xl">SH-82</dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-cyan-400/20 via-transparent to-rose-500/20 blur-2xl" />
            <div className="relative h-[520px] overflow-hidden rounded-[32px] border border-cyan-400/20">
              <CampusMap showLocations heat className="h-full min-h-[520px] w-full rounded-[32px] border-0" />
              <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/10 bg-[#05070d]/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                Live GIS · OSM campus polygon
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="glass rounded-3xl p-5">
              <feature.icon className="h-5 w-5 text-cyan-300" />
              <h2 className="mt-4 font-display text-xl">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Institute</p>
            <h2 className="mt-2 font-display text-4xl">Built around BIT Sathy, not a generic campus.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {CAMPUS_META.address}. Autonomous, AICTE-approved, affiliated to Anna University.
              Hostels named Sapphire through Pearl and Ganga through Bhavani sit on the northern belt;
              academic core and Sun Flower Block (School of Computing) are OSM-verified.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Main Gate", "SH-82 west edge"],
              ["Sun Flower Block", "School of Computing"],
              ["Learning Centre", "5-storey library"],
              ["Vedanayagam", "750-seat auditorium"],
              ["Gents hostels", "Sapphire–Pearl"],
              ["Ladies hostels", "Ganga–Bhavani"],
              ["Data Centre", "Campus Wi-Fi spine"],
              ["Medical Centre", "24×7 + ambulance"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
