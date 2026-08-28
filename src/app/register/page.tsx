"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { api } from "@/lib/client";
import { COLLEGE_EMAIL_DOMAIN, DEPARTMENTS } from "@/lib/constants";
import { SiteFooter } from "@/components/brand/SiteFooter";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", registerNo: "", department: "CSE", hostel: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!form.email.toLowerCase().endsWith(`@${COLLEGE_EMAIL_DOMAIN}`)) {
        throw new Error(`Use your college mail ID ending in @${COLLEGE_EMAIL_DOMAIN}`);
      }
      await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-semibold">Student registration</h1>
        <p className="text-sm text-[var(--muted)]">Use your college mail ID ending in @{COLLEGE_EMAIL_DOMAIN}</p>
        <Field label="Full name">
          <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Student email">
          <Input type="email" required placeholder={`7376221aiml201@${COLLEGE_EMAIL_DOMAIN}`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Password">
          <Input type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <Field label="Register number">
          <Input value={form.registerNo} onChange={(event) => setForm({ ...form, registerNo: event.target.value })} />
        </Field>
        <Field label="Department">
          <Select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>
            {DEPARTMENTS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} — {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hostel (optional)">
          <Input value={form.hostel} onChange={(event) => setForm({ ...form, hostel: event.target.value })} />
        </Field>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button disabled={busy} className="w-full">{busy ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-[var(--muted)]">
          Already enrolled? <Link className="text-[var(--accent)]" href="/login">Sign in</Link>
        </p>
      </form>
    </div>
    <SiteFooter />
    </div>
  );
}
