import { prisma } from "./prisma";

export async function notify(input: {
  userId: string;
  complaintId?: string;
  title: string;
  body: string;
  actorId?: string;
}) {
  if (input.actorId && input.actorId === input.userId) return;
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { notifyInApp: true } });
  if (!user?.notifyInApp) return;
  await prisma.notification.create({
    data: {
      userId: input.userId,
      complaintId: input.complaintId,
      title: input.title,
      body: input.body,
    },
  });
}

export async function syncOverdueSlaNotifications() {
  const overdue = await prisma.complaint.findMany({
    where: {
      status: { notIn: ["RESOLVED", "CLOSED"] },
      dueAt: { lt: new Date() },
    },
    select: { id: true, ticketNo: true, reporterId: true, assigneeId: true },
  });

  for (const item of overdue) {
    const existing = await prisma.notification.findFirst({
      where: { complaintId: item.id, title: "SLA exceeded" },
      select: { id: true },
    });
    if (existing) continue;
    const userId = item.assigneeId ?? item.reporterId;
    await prisma.notification.create({
      data: {
        userId,
        complaintId: item.id,
        title: "SLA exceeded",
        body: `${item.ticketNo} has exceeded its SLA.`,
      },
    });
  }
}
