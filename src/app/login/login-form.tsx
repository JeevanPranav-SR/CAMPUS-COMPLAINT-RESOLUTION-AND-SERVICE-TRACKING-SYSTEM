"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const DEMOS = [
  { label: "Student · Priya (CSE)", email: "priya.s@bitsathy.ac.in", password: "student123" },
  { label: "Student · Karthik (Sapphire)", email: "karthik.r@bitsathy.ac.in", password: "student123" },
  { label: "Faculty · Dr. Meena (ECE)", email: "meena.k@bitsathy.ac.in", password: "faculty123" },
  { label: "Staff · Ramesh (Electrical)", email: "ramesh.m@bitsathy.ac.in", password: "staff123" },
  { label: "Warden · Lakshmi", email: "lakshmi.w@bitsathy.ac.in", password: "warden123" },
  { label: "Admin · Estate Control", email: "admin@bitsathy.ac.in", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [email, setEmail] = useState(DEMOS[0].email);
  const [password, setPassword] = useState(DEMOS[0].password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Unable to sign in");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#070b14] p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <Link href="/" className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-cyan-400 font-display text-lg font-bold text-slate-950">
            BIT
          </div>
          <span className="font-display text-2xl">NEXUS</span>
        </Link>
        <div className="relative max-w-md">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Sathyamangalam campus</p>
          <h1 className="mt-3 font-display text-5xl leading-tight">Every broken light gets a coordinate.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Sign in with a demo role to walk the full loop — file on the map, assign a crew, beat the SLA.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">Alathukombai · Erode 638 401 · SH-82</p>
      </div>
      <div className="flex items-center justify-center bg-[#05070d] px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-md space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-300">Secure access</p>
            <h2 className="mt-2 font-display text-4xl">Enter BIT NEXUS</h2>
          </div>
          <label className="block text-sm">
            <span className="text-slate-400">Institute email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            disabled={busy}
            className="w-full rounded-2xl bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 disabled:opacity-60"
          >
            {busy ? "Authenticating…" : "Sign in"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            {DEMOS.map((demo) => (
              <button
                type="button"
                key={demo.email}
                onClick={() => {
                  setEmail(demo.email);
                  setPassword(demo.password);
                }}
                className="rounded-2xl border border-white/10 px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-white/5"
              >
                {demo.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            New student?{" "}
            <Link href="/register" className="text-cyan-300">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
