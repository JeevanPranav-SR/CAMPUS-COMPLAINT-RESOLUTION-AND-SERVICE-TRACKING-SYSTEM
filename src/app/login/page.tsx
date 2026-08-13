import { Suspense } from "react";
import LoginForm from "./login-form";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[var(--muted)]">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
