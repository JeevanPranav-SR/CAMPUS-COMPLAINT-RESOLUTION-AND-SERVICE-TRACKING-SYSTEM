import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { createSession, getSession, type SessionUser } from "./session";
import type { Role } from "./constants";

export type { SessionUser };
export { getSession, createSession } from "./session";
export { clearSession } from "./session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  const session: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    department: user.department,
    hostel: user.hostel,
    registerNo: user.registerNo,
  };
  await createSession(session);
  return session;
}
