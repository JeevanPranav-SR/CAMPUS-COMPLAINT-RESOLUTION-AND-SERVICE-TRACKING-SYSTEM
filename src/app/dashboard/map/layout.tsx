import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export default async function MapLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !can(user, "complaint:view_own")) {
    redirect("/dashboard");
  }
  return children;
}
