import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export default async function NewComplaintLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!can(user, "complaint:create")) redirect("/dashboard");
  return children;
}
