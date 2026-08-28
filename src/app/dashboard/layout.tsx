import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/shell/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[var(--muted)]">Loading…</p>}>
      <AppShell user={user}>{children}</AppShell>
    </Suspense>
  );
}
