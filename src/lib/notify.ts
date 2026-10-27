import { sendEmail, sendSms } from "./channels";
import { prisma } from "./prisma";

function ticketLink(complaintId?: string) {
  const base = process.env.APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return base && complaintId ? `${base}/dashboard/complaints/${complaintId}` : undefined;
}

/**
 * In-app notification, plus email/SMS when `external` is set (status changes,
 * technician assignment, resolution). External channels are optional and
 * silently skipped when their provider keys are not configured.
 */
export async function notify(input: {
  userId: string;
  complaintId?: string;
  title: string;
  body: string;
  actorId?: string;
  external?: boolean;
}) {
  if (input.actorId && input.actorId === input.userId) return;
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, phone: true, notifyInApp: true, notifyEmail: true, notifySms: true, active: true },
  });
  if (!user?.active) return;

  if (user.notifyInApp) {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        complaintId: input.complaintId,
        title: input.title,
        body: input.body,
        channels: "in-app",
      },
    });
  }

  if (!input.external) return;
  const link = ticketLink(input.complaintId);
  void Promise.all([
    user.notifyEmail ? sendEmail(user.email, input.title, input.body, link) : Promise.resolve("skipped"),
    user.notifySms && user.phone ? sendSms(user.phone, `BIT NEXUS: ${input.body}`) : Promise.resolve("skipped"),
  ]).catch(() => undefined);
}

export async function syncOverdueSlaNotifications() {
  const overdue = await prisma.complaint.findMany({
    where: {
      status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] },
      dueAt: { lt: new Date() },
      notifications: { none: { title: "SLA exceeded" } },
    },
    select: { id: true, ticketNo: true, reporterId: true, assigneeId: true },
  });
  if (overdue.length === 0) return;

  await prisma.notification.createMany({
    data: overdue.map((item) => ({
      userId: item.assigneeId ?? item.reporterId,
      complaintId: item.id,
      title: "SLA exceeded",
      body: `${item.ticketNo} has exceeded its SLA.`,
      channels: "in-app",
    })),
  });
}
