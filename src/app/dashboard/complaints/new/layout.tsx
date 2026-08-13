import { redirect } from "next/navigation";
import { isReporter } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default async function NewComplaintLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isReporter(user.role) && user.role !== "ADMIN") redirect("/dashboard/complaints");
  return children;
}
