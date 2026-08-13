import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/complaints",
    "/api/complaints/:path*",
    "/api/stats",
    "/api/stats/:path*",
    "/api/staff",
    "/api/staff/:path*",
    "/api/auth/me",
  ],
};
