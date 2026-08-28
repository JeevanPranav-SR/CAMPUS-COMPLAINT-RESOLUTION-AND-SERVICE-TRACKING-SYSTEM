import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !can(user, "user:manage")) redirect("/dashboard");
  return children;
}
