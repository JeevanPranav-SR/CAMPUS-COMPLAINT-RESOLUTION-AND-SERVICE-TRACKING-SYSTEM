import { fail, ok, readJson } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      hostel: true,
      registerNo: true,
      phone: true,
      notifyInApp: true,
    },
  });
  if (!user) return fail("NOT_FOUND", "Account not found.", 404);
  return ok({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return fail("UNAUTHENTICATED", "Sign in required.", 401);

  const parsed = await readJson<{
    name?: string;
    phone?: string;
    hostel?: string;
    notifyInApp?: boolean;
    currentPassword?: string;
    newPassword?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  if (body.newPassword) {
    if (body.newPassword.length < 8) return fail("VALIDATION", "New password must be at least 8 characters.", 400);
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !body.currentPassword || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return fail("INVALID_CREDENTIALS", "Current password is incorrect.", 400);
    }
    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      name: body.name?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      hostel: body.hostel?.trim() || undefined,
      notifyInApp: typeof body.notifyInApp === "boolean" ? body.notifyInApp : undefined,
    },
  });

  await createSession({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role as typeof session.role,
    department: updated.department,
    hostel: updated.hostel,
    registerNo: updated.registerNo,
  });

  return ok({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      hostel: updated.hostel,
      registerNo: updated.registerNo,
      phone: updated.phone,
      notifyInApp: updated.notifyInApp,
    },
  });
}
