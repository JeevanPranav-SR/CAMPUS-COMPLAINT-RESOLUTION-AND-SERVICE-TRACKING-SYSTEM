import { fail, ok } from "@/lib/http";
import { canAssign } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!canAssign(user.role) && user.role !== "STAFF") return ok({ staff: [] });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "WARDEN"] } },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });
  return ok({ staff });
}
