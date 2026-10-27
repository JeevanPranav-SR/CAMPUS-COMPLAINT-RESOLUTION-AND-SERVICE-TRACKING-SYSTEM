"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { api } from "@/lib/client";
import { COLLEGE_EMAIL_DOMAIN, DEPARTMENTS, ROLE_META, SELF_REGISTER_ROLES } from "@/lib/constants";
import { SiteFooter } from "@/components/brand/SiteFooter";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ role: "STUDENT", name: "", email: "", password: "", registerNo: "", department: "CSE", hostel: "" });
  const student = form.role === "STUDENT";
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
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-[var(--muted)]">
          Students and faculty register with their college mail ID ending in @{COLLEGE_EMAIL_DOMAIN}. Technician, department head and admin accounts are issued by the Super Admin.
        </p>
        <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-2">
          {SELF_REGISTER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              role="radio"
              aria-checked={form.role === role}
              onClick={() => setForm({ ...form, role })}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${form.role === role ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] hover:bg-slate-50"}`}
            >
              {ROLE_META[role].label}
            </button>
          ))}
        </div>
        <Field label="Full name">
          <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label={student ? "Student email" : "Faculty email"}>
          <Input type="email" required placeholder={student ? `7376221aiml201@${COLLEGE_EMAIL_DOMAIN}` : `name.dept@${COLLEGE_EMAIL_DOMAIN}`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Password">
          <Input type="password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <Field label={student ? "Register number" : "Employee ID (optional)"}>
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
        {student ? (
          <Field label="Hostel (optional)">
            <Input value={form.hostel} onChange={(event) => setForm({ ...form, hostel: event.target.value })} />
          </Field>
        ) : null}
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
