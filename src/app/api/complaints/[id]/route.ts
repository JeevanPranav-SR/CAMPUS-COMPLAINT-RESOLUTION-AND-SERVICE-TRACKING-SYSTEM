import { fail, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { allowedTransitions, canAssign, canViewComplaint, canUpdateWork, isReporter } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ticketInclude } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { STATUSES, slaHours, type Priority, type Status } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({ where: { id }, include: ticketInclude });
  if (!complaint) return fail("NOT_FOUND", "Complaint not found.", 404);
  if (!canViewComplaint(user, complaint)) return fail("FORBIDDEN", "You cannot view this complaint.", 403);

  const staff = canUpdateWork(user.role)
    ? await prisma.user.findMany({
        where: { role: { in: ["STAFF", "WARDEN"] } },
        select: { id: true, name: true, department: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  return ok({ complaint, staff });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const { id } = await params;
  const parsed = await readJson<{
    status?: Status;
    assigneeId?: string | null;
    note?: string;
    rating?: number;
    ratingComment?: string;
    reason?: string;
    override?: boolean;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "Complaint not found.", 404);
  if (!canViewComplaint(user, existing)) return fail("FORBIDDEN", "You cannot update this complaint.", 403);

  if (user.role === "STAFF" && existing.assigneeId && existing.assigneeId !== user.id) {
    return fail("FORBIDDEN", "Staff can only update tickets assigned to them.", 403);
  }

  let nextStatus = existing.status as Status;
  let assigneeId = existing.assigneeId;
  const note = body.note?.trim() || body.reason?.trim() || "";
  const override = body.override === true && user.role === "ADMIN" && note.length >= 8;

  if (body.assigneeId !== undefined) {
    const selfAssign = user.role === "STAFF" && body.assigneeId === user.id;
    if (!canAssign(user.role) && !selfAssign) return fail("FORBIDDEN", "You cannot assign staff.", 403);
    assigneeId = body.assigneeId;
    if (body.assigneeId && ["SUBMITTED", "ACKNOWLEDGED", "REOPENED", "ASSIGNED"].includes(existing.status)) {
      nextStatus = "ASSIGNED";
    }
  }

  if (body.status) {
    if (!STATUSES.includes(body.status)) {
      return fail("VALIDATION", "Select a valid status.", 400);
    }
    const allowed = allowedTransitions(existing.status as Status, user.role);
    const selfAssign =
      user.role === "STAFF" &&
      body.status === "ASSIGNED" &&
      body.assigneeId === user.id &&
      allowed.includes("ASSIGNED");
    if (!override && !allowed.includes(body.status) && !selfAssign) {
      return fail("FORBIDDEN", "That status change is not allowed.", 400);
    }
    if (isReporter(user.role) && body.status === "REOPENED" && !note) {
      return fail("VALIDATION", "Please explain why the issue is not resolved.", 400);
    }
    if (isReporter(user.role) && body.status === "CLOSED" && body.rating && (body.rating < 1 || body.rating > 5)) {
      return fail("VALIDATION", "Rating must be between 1 and 5.", 400);
    }
    nextStatus = body.status;
  }

  if (nextStatus === "ASSIGNED" && !assigneeId) {
    return fail("VALIDATION", "Select a staff member before assigning.", 400);
  }
  if (user.role === "STAFF" && nextStatus === "IN_PROGRESS" && assigneeId !== user.id) {
    return fail("FORBIDDEN", "Staff can only start work on tickets assigned to them.", 403);
  }

  if (
    nextStatus === existing.status &&
    assigneeId === existing.assigneeId &&
    !note &&
    body.rating === undefined &&
    body.ratingComment === undefined
  ) {
    const complaint = await prisma.complaint.findUnique({ where: { id }, include: ticketInclude });
    return ok({ complaint });
  }

  const now = new Date();
  const reopened = nextStatus === "REOPENED" && existing.status !== "REOPENED";
  const reopenHours = slaHours(existing.category, existing.priority as Priority);
  const action =
    nextStatus === "REOPENED"
      ? "REOPEN"
      : nextStatus === "CLOSED"
        ? "VERIFY"
        : nextStatus === "ASSIGNED" && assigneeId !== existing.assigneeId
          ? "ASSIGN"
          : "STATUS";

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status: nextStatus,
      assigneeId,
      rating: body.rating ?? existing.rating,
      ratingComment: body.ratingComment ?? existing.ratingComment,
      reopenCount: reopened ? existing.reopenCount + 1 : existing.reopenCount,
      slaHours: reopened ? reopenHours : existing.slaHours,
      dueAt: reopened ? new Date(now.getTime() + reopenHours * 3600000) : existing.dueAt,
      acknowledgedAt: nextStatus === "ACKNOWLEDGED" ? existing.acknowledgedAt ?? now : existing.acknowledgedAt,
      assignedAt: nextStatus === "ASSIGNED" ? now : existing.assignedAt,
      resolvedAt:
        nextStatus === "RESOLVED"
          ? now
          : nextStatus === "CLOSED"
            ? existing.resolvedAt ?? now
            : reopened
              ? null
              : existing.resolvedAt,
      closedAt: nextStatus === "CLOSED" ? now : reopened ? null : existing.closedAt,
      events: {
        create: {
          status: nextStatus,
          action,
          note:
            note ||
            (nextStatus === "ASSIGNED" && assigneeId
              ? "Assigned to a campus worker."
              : reopened
                ? "Complaint reopened. A new SLA window has started."
                : `Status updated to ${nextStatus.replace(/_/g, " ").toLowerCase()}.`),
          actorId: user.id,
        },
      },
    },
    include: ticketInclude,
  });

  const recipients = new Set<string>();
  recipients.add(complaint.reporterId);
  if (complaint.assigneeId) recipients.add(complaint.assigneeId);
  await Promise.all(
    [...recipients].map((userId) =>
      notify({
        userId,
        complaintId: complaint.id,
        actorId: user.id,
        title: `${complaint.ticketNo} updated`,
        body:
          nextStatus === "RESOLVED"
            ? `${complaint.ticketNo} has been marked resolved. Please verify.`
            : nextStatus === "REOPENED"
              ? `${complaint.ticketNo} was reopened and needs attention.`
              : nextStatus === "ASSIGNED"
                ? `${complaint.ticketNo} was assigned to ${complaint.assignee?.name ?? "staff"}.`
                : `${complaint.ticketNo} is now ${nextStatus.replace(/_/g, " ").toLowerCase()}.`,
      }),
    ),
  );

  return ok({ complaint });
}
