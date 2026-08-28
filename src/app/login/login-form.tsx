"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api } from "@/lib/client";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { safeDashboardPath } from "@/lib/redirect";
import { BrandLockup, SiteFooter } from "@/components/brand/SiteFooter";

export default function LoginForm() {
  const router = useRouter();
  const next = safeDashboardPath(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
    <div className="grid min-h-0 flex-1 lg:grid-cols-2">
      <div className="hidden bg-[var(--primary)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandLockup light href="/" />
        <div>
          <h1 className="text-4xl font-semibold leading-tight">One platform for every campus service issue.</h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            Report, assign, track SLA and close work across the 181-acre Sathyamangalam campus.
          </p>
        </div>
        <p className="text-xs text-white/60">Bannari Amman Institute of Technology</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-md space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Sign in</p>
            <h2 className="mt-1 text-2xl font-semibold">Campus service operations</h2>
          </div>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--muted)]">Sample college mail IDs for checking</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  className="rounded-md border border-[var(--border)] px-2 py-2 text-left text-xs"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                  }}
                >
                  <span className="block font-medium">{demo.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{demo.email}</span>
                  <span className="block truncate text-[10px] text-[var(--muted)]">{demo.password}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Student? <Link className="text-[var(--accent)]" href="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
    <SiteFooter />
    </div>
  );
}
