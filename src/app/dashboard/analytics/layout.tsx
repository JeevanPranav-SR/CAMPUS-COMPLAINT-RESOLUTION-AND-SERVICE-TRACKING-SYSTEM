import { redirect } from "next/navigation";
import { isOps } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !isOps(user.role)) redirect("/dashboard");
  return children;
}
