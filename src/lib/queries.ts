import type { Prisma } from "@prisma/client";
import { analyticsScope, complaintScope } from "./rbac";

export { analyticsScope, complaintScope };

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
