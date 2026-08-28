import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { normalizeRole, type Role } from "./constants";
import { permissionsFor, type Permission } from "./rbac";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  hostel: string | null;
  registerNo: string | null;
  permissions: Permission[];
};

export const SESSION_COOKIE = "bit_session";

export function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required");
    }
    return new TextEncoder().encode("bit-dev-secret");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret());
}

export async function readSession(token?: string | null): Promise<{ id: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return { id: String(payload.id) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const parsed = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;
  const user = await prisma.user.findUnique({ where: { id: parsed.id } });
  if (!user || user.active === false) return null;
  const role = normalizeRole(user.role);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    department: user.department,
    hostel: user.hostel,
    registerNo: user.registerNo,
    permissions: permissionsFor(role),
  };
}

export async function createSession(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
