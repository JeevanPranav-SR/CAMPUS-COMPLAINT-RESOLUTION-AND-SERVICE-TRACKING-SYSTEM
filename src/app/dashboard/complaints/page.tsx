import { Suspense } from "react";
import ComplaintsPage from "./list";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading complaints…</p>}>
      <ComplaintsPage />
    </Suspense>
  );
}
