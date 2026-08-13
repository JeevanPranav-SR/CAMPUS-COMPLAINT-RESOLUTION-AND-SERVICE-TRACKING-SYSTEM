import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./constants";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  hostel: string | null;
  registerNo: string | null;
};

export const SESSION_COOKIE = "bit_session";

export function authSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "bit-dev-secret");
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret());
}

export async function readSession(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
      department: (payload.department as string | null) ?? null,
      hostel: (payload.hostel as string | null) ?? null,
      registerNo: (payload.registerNo as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
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
