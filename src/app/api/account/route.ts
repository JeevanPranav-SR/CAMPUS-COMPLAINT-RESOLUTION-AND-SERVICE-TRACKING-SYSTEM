import { fail, ok, readJson } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession, getSession, invalidateSession } from "@/lib/session";
import { normalizeRole } from "@/lib/constants";
import { emailConfigured, smsConfigured } from "@/lib/channels";

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
      notifyEmail: true,
      notifySms: true,
    },
  });
  if (!user) return fail("NOT_FOUND", "Account not found.", 404);
  return ok({
    user: { ...user, role: normalizeRole(user.role) },
    channels: { email: emailConfigured(), sms: smsConfigured() },
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return fail("UNAUTHENTICATED", "Sign in required.", 401);

  const parsed = await readJson<{
    name?: string;
    phone?: string;
    hostel?: string;
    role?: string;
    department?: string;
    notifyInApp?: boolean;
    notifyEmail?: boolean;
    notifySms?: boolean;
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
      notifyInApp: typeof body.notifyInApp === "boolean" ? body.notifyInApp : undefined,
      notifyEmail: typeof body.notifyEmail === "boolean" ? body.notifyEmail : undefined,
      notifySms: typeof body.notifySms === "boolean" ? body.notifySms : undefined,
    },
  });

  invalidateSession(session.id);
  await createSession({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: session.role,
    department: updated.department,
    hostel: updated.hostel,
    registerNo: updated.registerNo,
    permissions: session.permissions,
  });

  return ok({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: normalizeRole(updated.role),
      department: updated.department,
      hostel: updated.hostel,
      registerNo: updated.registerNo,
      phone: updated.phone,
      notifyInApp: updated.notifyInApp,
      notifyEmail: updated.notifyEmail,
      notifySms: updated.notifySms,
    },
  });
}
