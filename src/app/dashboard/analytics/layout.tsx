import { redirect } from "next/navigation";
import { canAny } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !canAny(user, ["analytics:view", "analytics:view_department"])) redirect("/dashboard");
  return children;
}
