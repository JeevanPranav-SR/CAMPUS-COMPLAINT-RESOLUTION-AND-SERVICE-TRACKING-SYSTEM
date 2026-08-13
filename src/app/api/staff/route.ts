import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canSeeAll } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!canSeeAll(user.role)) return NextResponse.json({ staff: [] });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "WARDEN", "ADMIN"] } },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ staff });
}
