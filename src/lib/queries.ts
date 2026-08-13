import type { Prisma } from "@prisma/client";
import type { SessionUser } from "./session";
import { STAFF_QUEUE_STATUSES, isReporter, wardenLocationIds } from "./permissions";

export function complaintScope(user: SessionUser, scope = "default"): Prisma.ComplaintWhereInput {
  if (isReporter(user.role) || scope === "mine") return { reporterId: user.id };
  if (scope === "assigned" || user.role === "STAFF") {
    if (scope === "assigned") return { assigneeId: user.id };
    return {
      OR: [
        { assigneeId: user.id },
        { assigneeId: null, status: { in: [...STAFF_QUEUE_STATUSES] } },
      ],
    };
  }
  if (user.role === "WARDEN") {
    return { locationId: { in: wardenLocationIds(user) } };
  }
  return {};
}

export function analyticsScope(user: SessionUser): Prisma.ComplaintWhereInput | null {
  if (isReporter(user.role)) return null;
  if (user.role === "STAFF") return { assigneeId: user.id };
  if (user.role === "WARDEN") return { locationId: { in: wardenLocationIds(user) } };
  return {};
}

export const ticketListSelect = {
  id: true,
  ticketNo: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  status: true,
  locationId: true,
  lat: true,
  lng: true,
  landmark: true,
  reporterId: true,
  assigneeId: true,
  slaHours: true,
  dueAt: true,
  acknowledgedAt: true,
  assignedAt: true,
  resolvedAt: true,
  closedAt: true,
  reopenCount: true,
  rating: true,
  ratingComment: true,
  createdAt: true,
  updatedAt: true,
  reporter: { select: { id: true, name: true, role: true, department: true, hostel: true } },
  assignee: { select: { id: true, name: true, department: true, role: true } },
} satisfies Prisma.ComplaintSelect;

export const ticketInclude = {
  reporter: { select: { id: true, name: true, role: true, department: true, hostel: true } },
  assignee: { select: { id: true, name: true, department: true, role: true } },
  events: { orderBy: { createdAt: "asc" as const }, include: { actor: { select: { name: true, role: true } } } },
  comments: { orderBy: { createdAt: "asc" as const }, include: { actor: { select: { id: true, name: true, role: true } } } },
};
