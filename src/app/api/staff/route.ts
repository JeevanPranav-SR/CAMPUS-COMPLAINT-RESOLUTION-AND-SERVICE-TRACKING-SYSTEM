import { fail, ok } from "@/lib/http";
import { canAssign } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!canAssign(user)) return ok({ staff: [] });

  const staff = await prisma.user.findMany({
    where: { active: true, role: "STAFF" },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });
  return ok({ staff });
}
