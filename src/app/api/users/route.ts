import { fail, ok } from "@/lib/http";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { normalizeRole, ROLES } from "@/lib/constants";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!can(user, "user:manage")) return fail("FORBIDDEN", "You cannot manage users.", 403);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      hostel: true,
      phone: true,
      specialty: true,
      experienceYears: true,
      active: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return ok({
    users: users.map((item) => ({ ...item, role: normalizeRole(item.role) })),
    roles: ROLES,
  });
}
