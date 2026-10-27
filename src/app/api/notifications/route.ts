import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, body: true, read: true, complaintId: true, createdAt: true },
  });
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return ok({ notifications, unread });
}

export async function PATCH() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return ok({ ok: true });
}
