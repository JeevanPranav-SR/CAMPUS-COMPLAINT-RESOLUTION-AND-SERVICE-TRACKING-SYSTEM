import { SignJWT, jwtVerify, type JWTPayload } from "jose";
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

function sessionFromPayload(payload: JWTPayload): SessionUser | null {
  if (!payload.id) return null;
  const role = normalizeRole(String(payload.role ?? "STUDENT"));
  return {
    id: String(payload.id),
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    role,
    department: payload.department ? String(payload.department) : null,
    hostel: payload.hostel ? String(payload.hostel) : null,
    registerNo: payload.registerNo ? String(payload.registerNo) : null,
    permissions: permissionsFor(role),
  };
}

export async function readSession(token?: string | null): Promise<{ id: string } | null> {
  const user = await readSessionUser(token);
  return user ? { id: user.id } : null;
}

async function readSessionUser(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return sessionFromPayload(payload);
  } catch {
    return null;
  }
}

const SESSION_TTL_MS = 15_000;
const sessionCache = new Map<string, { user: SessionUser; expires: number }>();

export function invalidateSession(userId?: string) {
  if (userId) sessionCache.delete(userId);
  else sessionCache.clear();
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const tokenUser = await readSessionUser(store.get(SESSION_COOKIE)?.value);
  if (!tokenUser) return null;
  const cached = sessionCache.get(tokenUser.id);
  if (cached && cached.expires > Date.now()) return cached.user;
  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        hostel: true,
        registerNo: true,
        active: true,
      },
    });
    if (!user || user.active === false) {
      sessionCache.delete(tokenUser.id);
      return null;
    }
    const role = normalizeRole(user.role);
    const session: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      department: user.department,
      hostel: user.hostel,
      registerNo: user.registerNo,
      permissions: permissionsFor(role),
    };
    sessionCache.set(tokenUser.id, { user: session, expires: Date.now() + SESSION_TTL_MS });
    return session;
  } catch (error) {
    console.error("getSession database lookup failed", error);
    return tokenUser;
  }
}

export async function createSession(user: SessionUser) {
  invalidateSession(user.id);
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
  sessionCache.clear();
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
