import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { syncOverdueSlaNotifications } from "@/lib/notify";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  await syncOverdueSlaNotifications();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const unread = notifications.filter((item) => !item.read).length;
  return ok({ notifications, unread });
}

export async function PATCH() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return ok({ ok: true });
}
