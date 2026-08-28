import { redirect } from "next/navigation";
import { canAny } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !canAny(user, ["complaint:assign", "complaint:update_assigned"])) redirect("/dashboard");
  return children;
}
