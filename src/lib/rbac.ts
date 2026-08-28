import type { Prisma } from "@prisma/client";
import { CAMPUS_LOCATIONS } from "./campus";
import { CATEGORIES, type Role, type Status } from "./constants";

export type AccessUser = {
  id: string;
  role: Role;
  department: string | null;
  hostel: string | null;
};

export const PERMISSIONS = [
  "complaint:create",
  "complaint:view_own",
  "complaint:view_assigned",
  "complaint:view_hostel",
  "complaint:view_all",
  "complaint:update_own",
  "complaint:update_assigned",
  "complaint:assign",
  "complaint:resolve",
  "complaint:escalate",
  "complaint:comment",
  "user:manage",
  "role:manage",
  "department:manage",
  "category:manage",
  "analytics:view_personal",
  "analytics:view_hostel",
  "analytics:view",
  "audit:view",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS = [...PERMISSIONS];

const REPORTER_PERMISSIONS = [
  "complaint:create",
  "complaint:view_own",
  "complaint:update_own",
  "complaint:comment",
  "analytics:view_personal",
] as const;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  STUDENT: REPORTER_PERMISSIONS,
  FACULTY: REPORTER_PERMISSIONS,
  STAFF: [
    ...REPORTER_PERMISSIONS,
    "complaint:view_assigned",
    "complaint:update_assigned",
    "complaint:resolve",
  ],
  WARDEN: [
    ...REPORTER_PERMISSIONS,
    "complaint:view_hostel",
    "complaint:update_assigned",
    "complaint:assign",
    "complaint:resolve",
    "complaint:escalate",
    "analytics:view_hostel",
  ],
  ADMIN: ALL_PERMISSIONS,
};

export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function can(user: Pick<AccessUser, "role"> | null | undefined, permission: Permission) {
  if (!user) return false;
  return hasPermission(user.role, permission);
}

export function canAny(user: Pick<AccessUser, "role"> | null | undefined, permissions: Permission[]) {
  return permissions.some((permission) => can(user, permission));
}

export const HOSTEL_LOCATION_IDS = CAMPUS_LOCATIONS.filter((item) => item.zone.startsWith("hostel")).map(
  (item) => item.id,
);

export const STAFF_QUEUE_STATUSES: Status[] = ["SUBMITTED", "ACKNOWLEDGED", "REOPENED"];

export function hostelLocationIds(user: Pick<AccessUser, "hostel">) {
  const hostel = user.hostel?.toLowerCase() ?? "";
  if (hostel.includes("ladies")) {
    return CAMPUS_LOCATIONS.filter((item) => item.zone === "hostel-ladies").map((item) => item.id);
  }
  if (hostel.includes("gents")) {
    return CAMPUS_LOCATIONS.filter((item) => item.zone === "hostel-gents").map((item) => item.id);
  }
  return HOSTEL_LOCATION_IDS;
}

const UNIT_CATEGORIES: Record<string, string[]> = {
  "electrical maintenance": ["ELECTRICAL"],
  "civil & plumbing": ["PLUMBING", "WATER", "CIVIL"],
  "data centre": ["IT_WIFI"],
  "estate office": ["CIVIL", "FURNITURE", "OTHER", "ACADEMIC"],
  "office of the warden": ["HOSTEL", "MESS"],
  "transport office": ["TRANSPORT"],
  "security office": ["SECURITY"],
  "campus medical centre": ["MEDICAL"],
  "physical education": ["SPORTS"],
  "housekeeping": ["HOUSEKEEPING"],
  "student centre & mess": ["MESS"],
  "department office": ["ACADEMIC"],
};

export function categoryIdsForDepartment(department: string | null | undefined) {
  if (!department) return [] as string[];
  const mapped = UNIT_CATEGORIES[department.toLowerCase()];
  if (mapped) return mapped;
  return CATEGORIES.filter((item) => item.unit.toLowerCase() === department.toLowerCase()).map((item) => item.id);
}

export function hostelComplaintWhere(user: Pick<AccessUser, "hostel" | "department">): Prisma.ComplaintWhereInput {
  return { locationId: { in: hostelLocationIds(user) } };
}

export type ComplaintAccess = {
  reporterId: string;
  assigneeId: string | null;
  locationId: string;
  status: string;
  category: string;
};

export function canViewComplaint(user: AccessUser, complaint: ComplaintAccess) {
  if (hasPermission(user.role, "complaint:view_all")) return true;
  if (hasPermission(user.role, "complaint:view_own") && complaint.reporterId === user.id) return true;
  if (hasPermission(user.role, "complaint:view_assigned") && complaint.assigneeId === user.id) return true;
  if (user.role === "STAFF" && !complaint.assigneeId && STAFF_QUEUE_STATUSES.includes(complaint.status as Status)) {
    const categories = categoryIdsForDepartment(user.department);
    return categories.length === 0 || categories.includes(complaint.category);
  }
  if (hasPermission(user.role, "complaint:view_hostel")) {
    return hostelLocationIds(user).includes(complaint.locationId);
  }
  return false;
}

export function canAssign(userOrRole: Pick<AccessUser, "role"> | Role) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  return hasPermission(role, "complaint:assign");
}

export function canUpdateWork(user: AccessUser, complaint: ComplaintAccess) {
  if (hasPermission(user.role, "complaint:view_all")) return true;
  if (hasPermission(user.role, "complaint:view_hostel")) {
    return hostelLocationIds(user).includes(complaint.locationId);
  }
  if (hasPermission(user.role, "complaint:update_assigned")) {
    if (complaint.assigneeId === user.id) return true;
    if (user.role === "STAFF" && !complaint.assigneeId) return canViewComplaint(user, complaint);
  }
  return false;
}

export function isOwner(user: Pick<AccessUser, "id">, complaint: Pick<ComplaintAccess, "reporterId">) {
  return complaint.reporterId === user.id;
}

export function allowedTransitions(current: Status, user: AccessUser, complaint: ComplaintAccess): Status[] {
  if (current === "CLOSED" || current === "REJECTED") {
    if (isOwner(user, complaint) && hasPermission(user.role, "complaint:update_own") && current === "REJECTED") {
      return [];
    }
    return [];
  }

  const next = new Set<Status>();
  const owner = isOwner(user, complaint);
  const handler = canUpdateWork(user, complaint);

  if (owner && hasPermission(user.role, "complaint:update_own") && current === "RESOLVED") {
    next.add("CLOSED");
    next.add("REOPENED");
  }

  if (!handler) return [...next];

  if (hasPermission(user.role, "complaint:assign")) {
    if (current === "SUBMITTED") {
      next.add("ACKNOWLEDGED");
      next.add("ASSIGNED");
      next.add("REJECTED");
    }
    if (current === "ACKNOWLEDGED") next.add("ASSIGNED");
    if (current === "ASSIGNED" || current === "REOPENED" || current === "ESCALATED") next.add("IN_PROGRESS");
    if (current === "ASSIGNED" || current === "REOPENED") next.add("ASSIGNED");
  }

  if (hasPermission(user.role, "complaint:update_assigned")) {
    if (user.role === "STAFF") {
      if (current === "REOPENED") {
        next.add("ASSIGNED");
        next.add("IN_PROGRESS");
      }
      if (STAFF_QUEUE_STATUSES.includes(current)) next.add("ASSIGNED");
      if (current === "ASSIGNED") next.add("IN_PROGRESS");
      if (current === "IN_PROGRESS") {
        next.add("ON_HOLD");
        next.add("RESOLVED");
      }
      if (current === "ON_HOLD") {
        next.add("IN_PROGRESS");
        next.add("RESOLVED");
      }
      if (current === "ESCALATED") next.add("IN_PROGRESS");
    } else {
      if (current === "ASSIGNED" || current === "REOPENED" || current === "ESCALATED") next.add("IN_PROGRESS");
      if (current === "IN_PROGRESS") {
        next.add("ON_HOLD");
        next.add("RESOLVED");
      }
      if (current === "ON_HOLD") {
        next.add("IN_PROGRESS");
        next.add("RESOLVED");
      }
    }
  }

  if (hasPermission(user.role, "complaint:resolve") && ["IN_PROGRESS", "ON_HOLD", "ASSIGNED", "ESCALATED"].includes(current)) {
    next.add("RESOLVED");
  }

  if (hasPermission(user.role, "complaint:escalate") && !["RESOLVED", "CLOSED", "REJECTED"].includes(current)) {
    next.add("ESCALATED");
  }

  if (hasPermission(user.role, "complaint:view_all") && ["SUBMITTED", "ACKNOWLEDGED"].includes(current)) {
    next.add("REJECTED");
  }

  return [...next];
}

export type ComplaintScopeName = "default" | "mine" | "assigned" | "work" | "hostel" | "department" | "all";

export function isForbiddenScope(
  scope: Prisma.ComplaintWhereInput | { forbidden: true },
): scope is { forbidden: true } {
  return "forbidden" in scope && scope.forbidden === true;
}

export function staffWorkWhere(user: AccessUser): Prisma.ComplaintWhereInput {
  const categories = categoryIdsForDepartment(user.department);
  const queue: Prisma.ComplaintWhereInput = {
    assigneeId: null,
    status: { in: [...STAFF_QUEUE_STATUSES] },
  };
  if (categories.length) queue.category = { in: categories };
  return { OR: [{ assigneeId: user.id }, queue] };
}

/** Scope used for operations, map, and dashboard work queues. Never mixes personal tickets into ops lists. */
export function operationalScopeParam(user: Pick<AccessUser, "role">) {
  if (hasPermission(user.role, "complaint:view_all")) return "all";
  if (hasPermission(user.role, "complaint:view_hostel")) return "hostel";
  if (hasPermission(user.role, "complaint:view_assigned")) return "work";
  return "mine";
}

export function complaintScope(
  user: AccessUser,
  scope: string,
): Prisma.ComplaintWhereInput | { forbidden: true } {
  const name = (scope || "default") as ComplaintScopeName;

  if (name === "mine") {
    if (!hasPermission(user.role, "complaint:view_own")) return { forbidden: true };
    return { reporterId: user.id };
  }
  if (name === "assigned") {
    if (!hasPermission(user.role, "complaint:view_assigned")) return { forbidden: true };
    return { assigneeId: user.id };
  }
  if (name === "work") {
    if (!hasPermission(user.role, "complaint:view_assigned") && !hasPermission(user.role, "complaint:view_all")) {
      return { forbidden: true };
    }
    if (hasPermission(user.role, "complaint:view_all")) return {};
    return staffWorkWhere(user);
  }
  if (name === "hostel" || name === "department") {
    if (!hasPermission(user.role, "complaint:view_hostel") && !hasPermission(user.role, "complaint:view_all")) {
      return { forbidden: true };
    }
    if (hasPermission(user.role, "complaint:view_all")) return {};
    return hostelComplaintWhere(user);
  }
  if (name === "all") {
    if (!hasPermission(user.role, "complaint:view_all")) return { forbidden: true };
    return {};
  }

  if (hasPermission(user.role, "complaint:view_all")) return {};
  if (hasPermission(user.role, "complaint:view_own")) return { reporterId: user.id };
  return { forbidden: true };
}

export function analyticsScope(user: AccessUser): Prisma.ComplaintWhereInput | null {
  if (hasPermission(user.role, "analytics:view") || hasPermission(user.role, "complaint:view_all")) return {};
  if (hasPermission(user.role, "analytics:view_hostel")) return hostelComplaintWhere(user);
  if (hasPermission(user.role, "analytics:view_personal")) return { reporterId: user.id };
  return null;
}

export function isReporter(role: Role) {
  return role === "STUDENT" || role === "FACULTY";
}

export function isOps(role: Role) {
  return hasPermission(role, "complaint:update_assigned") || hasPermission(role, "complaint:assign");
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function wardenLocationIds(user: Pick<AccessUser, "hostel">) {
  return hostelLocationIds(user);
}
