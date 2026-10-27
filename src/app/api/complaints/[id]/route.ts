import { fail, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { writeAudit } from "@/lib/audit";
import {
  allowedTransitions,
  can,
  canAssign,
  canUpdateWork,
  canViewComplaint,
  isOwner,
  type AccessUser,
} from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ticketInclude } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { normalizeRole, roleValues, STATUSES, slaHours, type Priority, type Status } from "@/lib/constants";
import { departmentName, opsDepartmentOf, routeComplaint } from "@/lib/routing";

type Params = { params: Promise<{ id: string }> };

/** Technicians a manager may assign: their own department, or everyone for Super Admin. */
async function assignableTechnicians(user: AccessUser) {
  const technicians = await prisma.user.findMany({
    where: { active: true, role: { in: roleValues("TECHNICIAN") } },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });
  const normalized = technicians.map((item) => ({ ...item, role: normalizeRole(item.role) }));
  if (can(user, "complaint:view_all")) return normalized;
  const department = opsDepartmentOf(user.department);
  return normalized.filter((item) => opsDepartmentOf(item.department) === department);
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({ where: { id }, include: ticketInclude });
  if (!complaint) return fail("NOT_FOUND", "Complaint not found.", 404);
  if (!canViewComplaint(user, complaint)) return fail("FORBIDDEN", "You cannot view this complaint.", 403);

  const staff = canAssign(user) ? await assignableTechnicians(user) : [];
  const department = routeComplaint(complaint.category, complaint.locationId);

  return ok({
    complaint: { ...complaint, department, departmentName: departmentName(department) },
    staff,
    allowed: allowedTransitions(complaint.status as Status, user, complaint),
  });
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

  const technician = user.role === "TECHNICIAN";
  if (technician && existing.assigneeId && existing.assigneeId !== user.id && !isOwner(user, existing)) {
    return fail("FORBIDDEN", "Technicians can only update tickets assigned to them.", 403);
  }

  let nextStatus = existing.status as Status;
  let assigneeId = existing.assigneeId;
  const note = body.note?.trim() || body.reason?.trim() || "";
  const override = body.override === true && can(user, "complaint:view_all") && note.length >= 8;

  if (body.assigneeId !== undefined) {
    const selfAssign = technician && body.assigneeId === user.id;
    if (!canAssign(user) && !selfAssign) return fail("FORBIDDEN", "You cannot assign technicians.", 403);
    if (body.assigneeId && !selfAssign) {
      const allowedIds = (await assignableTechnicians(user)).map((item) => item.id);
      if (!allowedIds.includes(body.assigneeId)) {
        return fail("VALIDATION", "Assign an active technician from the responsible department.", 400);
      }
    }
    assigneeId = body.assigneeId;
    if (body.assigneeId && ["SUBMITTED", "ACKNOWLEDGED", "REOPENED", "ASSIGNED", "ESCALATED"].includes(existing.status)) {
      nextStatus = "ASSIGNED";
    }
  }

  if (body.status) {
    if (!STATUSES.includes(body.status)) {
      return fail("VALIDATION", "Select a valid status.", 400);
    }
    const allowed = allowedTransitions(existing.status as Status, user, existing);
    const selfAssign =
      technician && body.status === "ASSIGNED" && body.assigneeId === user.id && allowed.includes("ASSIGNED");
    if (!override && !allowed.includes(body.status) && !selfAssign) {
      return fail("FORBIDDEN", "That status change is not allowed.", 403);
    }
    if (isOwner(user, existing) && body.status === "REOPENED" && !note) {
      return fail("VALIDATION", "Please explain why the issue is not resolved.", 400);
    }
    if (isOwner(user, existing) && body.status === "CLOSED" && body.rating && (body.rating < 1 || body.rating > 5)) {
      return fail("VALIDATION", "Rating must be between 1 and 5.", 400);
    }
    nextStatus = body.status;
  }

  if (nextStatus === "ASSIGNED" && !assigneeId) {
    return fail("VALIDATION", "Select a technician before assigning.", 400);
  }
  if (technician && nextStatus === "IN_PROGRESS" && assigneeId !== user.id) {
    return fail("FORBIDDEN", "You can only start work on tickets assigned to you.", 403);
  }
  if (nextStatus === "RESOLVED" && !can(user, "complaint:resolve") && !canUpdateWork(user, existing)) {
    return fail("FORBIDDEN", "You cannot resolve this complaint.", 403);
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
  const newAssignment = Boolean(assigneeId) && assigneeId !== existing.assigneeId;
  const action =
    nextStatus === "REOPENED"
      ? "REOPEN"
      : nextStatus === "CLOSED"
        ? "VERIFY"
        : nextStatus === "ASSIGNED" && newAssignment
          ? "ASSIGN"
          : nextStatus === "ESCALATED"
            ? "ESCALATE"
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
              ? "Assigned to a maintenance technician."
              : reopened
                ? "Complaint reopened. A new SLA window has started."
                : `Status updated to ${nextStatus.replace(/_/g, " ").toLowerCase()}.`),
          actorId: user.id,
        },
      },
    },
    include: ticketInclude,
  });

  await writeAudit({
    actorId: user.id,
    action: `COMPLAINT_${action}`,
    entity: "Complaint",
    entityId: complaint.id,
    detail: `${complaint.ticketNo} ${existing.status} → ${nextStatus}`,
  });

  const recipients = new Set<string>();
  recipients.add(complaint.reporterId);
  if (complaint.assigneeId) recipients.add(complaint.assigneeId);
  if (nextStatus === "ESCALATED") {
    const department = routeComplaint(complaint.category, complaint.locationId);
    const managers = await prisma.user.findMany({
      where: { active: true, role: { in: [...roleValues("SUPER_ADMIN"), ...roleValues("DEPARTMENT_HEAD")] } },
      select: { id: true, role: true, department: true },
    });
    managers
      .filter((item) => normalizeRole(item.role) === "SUPER_ADMIN" || opsDepartmentOf(item.department) === department)
      .forEach((item) => recipients.add(item.id));
  }

  const statusText = nextStatus.replace(/_/g, " ").toLowerCase();
  await Promise.all(
    [...recipients].map((userId) => {
      const isAssignee = userId === complaint.assigneeId;
      const body =
        newAssignment && isAssignee
          ? `${complaint.ticketNo} "${complaint.title}" has been assigned to you.`
          : nextStatus === "RESOLVED"
            ? `${complaint.ticketNo} has been marked resolved. Please verify the fix or reopen it.`
            : nextStatus === "REOPENED"
              ? `${complaint.ticketNo} was reopened and needs attention.`
              : nextStatus === "ASSIGNED"
                ? `${complaint.ticketNo} was assigned to technician ${complaint.assignee?.name ?? ""}.`.trim()
                : nextStatus === "ESCALATED"
                  ? `${complaint.ticketNo} was escalated.`
                  : `${complaint.ticketNo} is now ${statusText}.`;
      return notify({
        userId,
        complaintId: complaint.id,
        actorId: user.id,
        title: newAssignment && isAssignee ? "New ticket assigned to you" : `${complaint.ticketNo} updated`,
        body,
        external: true,
      });
    }),
  );

  return ok({ complaint });
}
