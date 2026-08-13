import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

function isPublic(pathname: string) {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/login/") || pathname.startsWith("/register/")) return true;
  if (pathname.startsWith("/api/auth/login")) return true;
  if (pathname.startsWith("/api/auth/register")) return true;
  if (pathname.startsWith("/api/auth/logout")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("next", pathname === "/login" ? "/dashboard" : pathname);
  return NextResponse.redirect(login);
}

export const proxyConfig = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/api/complaints/:path*",
    "/api/complaints",
    "/api/stats/:path*",
    "/api/stats",
    "/api/staff/:path*",
    "/api/staff",
    "/api/notifications/:path*",
    "/api/notifications",
    "/api/account/:path*",
    "/api/account",
    "/api/auth/me",
  ],
};
