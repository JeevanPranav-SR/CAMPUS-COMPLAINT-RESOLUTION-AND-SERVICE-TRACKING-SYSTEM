import { fail, ok } from "@/lib/http";
import { can, canAssign } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { normalizeRole, roleValues } from "@/lib/constants";
import { opsDepartmentOf } from "@/lib/routing";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!canAssign(user)) return ok({ staff: [] });

  const staff = await prisma.user.findMany({
    where: { active: true, role: { in: roleValues("TECHNICIAN") } },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });
  const department = opsDepartmentOf(user.department);
  const scoped = can(user, "complaint:view_all")
    ? staff
    : staff.filter((item) => opsDepartmentOf(item.department) === department);
  return ok({ staff: scoped.map((item) => ({ ...item, role: normalizeRole(item.role) })) });
}
