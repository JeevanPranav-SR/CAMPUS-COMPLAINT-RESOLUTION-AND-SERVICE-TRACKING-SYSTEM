import { fail, ok, readJson } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLES, type Role } from "@/lib/constants";
import { hashPassword } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const actor = await getSession();
  if (!actor) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!can(actor, "user:manage")) return fail("FORBIDDEN", "You cannot manage users.", 403);

  const { id } = await params;
  const parsed = await readJson<{
    role?: Role;
    department?: string | null;
    hostel?: string | null;
    active?: boolean;
    name?: string;
    password?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "User not found.", 404);
  if (existing.id === actor.id && body.active === false) {
    return fail("VALIDATION", "You cannot deactivate your own account.", 400);
  }
  if (body.role && !ROLES.includes(body.role)) {
    return fail("VALIDATION", "Select a valid role.", 400);
  }
  if (body.role && !can(actor, "role:manage")) {
    return fail("FORBIDDEN", "You cannot assign roles.", 403);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: body.role ?? undefined,
      department: body.department === undefined ? undefined : body.department,
      hostel: body.hostel === undefined ? undefined : body.hostel,
      active: typeof body.active === "boolean" ? body.active : undefined,
      name: body.name?.trim() || undefined,
      passwordHash: body.password && body.password.length >= 8 ? await hashPassword(body.password) : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      hostel: true,
      active: true,
    },
  });

  if (body.role && body.role !== existing.role) {
    await writeAudit({
      actorId: actor.id,
      action: "ROLE_CHANGE",
      entity: "User",
      entityId: updated.id,
      detail: `${existing.email}: ${existing.role} → ${body.role}`,
    });
  }
  if (typeof body.active === "boolean" && body.active !== existing.active) {
    await writeAudit({
      actorId: actor.id,
      action: body.active ? "USER_ACTIVATE" : "USER_DEACTIVATE",
      entity: "User",
      entityId: updated.id,
      detail: updated.email,
    });
  }

  return ok({ user: updated });
}
