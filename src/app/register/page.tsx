"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    registerNo: "",
    department: "CSE",
    hostel: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Could not create account");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 py-16">
      <form onSubmit={submit} className="glass w-full max-w-lg space-y-4 rounded-[32px] p-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">Student onboarding</p>
        <h1 className="font-display text-4xl">Join BIT NEXUS</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["name", "Full name", "text"],
              ["email", "bitsathy.ac.in email", "email"],
              ["password", "Password", "password"],
              ["registerNo", "Register number", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="text-sm">
              <span className="text-slate-400">{label}</span>
              <input
                type={type}
                required={key !== "registerNo"}
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="text-slate-400">Department</span>
            <select
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
            >
              {["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Biotech", "Textile", "MBA"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Hostel (optional)</span>
            <input
              value={form.hostel}
              onChange={(event) => setForm({ ...form, hostel: event.target.value })}
              placeholder="Sapphire / Cauvery / …"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            />
          </label>
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          disabled={busy}
          className="w-full rounded-2xl bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950"
        >
          {busy ? "Creating…" : "Create student account"}
        </button>
        <p className="text-sm text-slate-500">
          Already enrolled?{" "}
          <Link className="text-cyan-300" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
