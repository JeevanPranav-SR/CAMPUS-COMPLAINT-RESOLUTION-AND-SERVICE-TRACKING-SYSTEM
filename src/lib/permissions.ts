import type { Role, Status } from "./constants";
import { CAMPUS_LOCATIONS } from "./campus";
import type { SessionUser } from "./session";

export function isReporter(role: Role) {
  return role === "STUDENT" || role === "FACULTY";
}

export function isOps(role: Role) {
  return role === "STAFF" || role === "WARDEN" || role === "ADMIN";
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export const HOSTEL_LOCATION_IDS = CAMPUS_LOCATIONS.filter((item) => item.zone.startsWith("hostel")).map(
  (item) => item.id,
);

export const STAFF_QUEUE_STATUSES: Status[] = ["SUBMITTED", "ACKNOWLEDGED", "REOPENED"];

export function wardenLocationIds(user: Pick<SessionUser, "hostel">) {
  const hostel = user.hostel?.toLowerCase() ?? "";
  if (hostel.includes("ladies")) {
    return CAMPUS_LOCATIONS.filter((item) => item.zone === "hostel-ladies").map((item) => item.id);
  }
  if (hostel.includes("gents")) {
    return CAMPUS_LOCATIONS.filter((item) => item.zone === "hostel-gents").map((item) => item.id);
  }
  return HOSTEL_LOCATION_IDS;
}

export function canViewComplaint(
  user: Pick<SessionUser, "id" | "role" | "hostel">,
  complaint: { reporterId: string; assigneeId: string | null; locationId: string; status: string },
) {
  if (user.role === "ADMIN") return true;
  if (isReporter(user.role)) return complaint.reporterId === user.id;
  if (user.role === "STAFF") {
    if (complaint.assigneeId === user.id) return true;
    return complaint.assigneeId === null && STAFF_QUEUE_STATUSES.includes(complaint.status as Status);
  }
  if (user.role === "WARDEN") {
    return wardenLocationIds(user).includes(complaint.locationId);
  }
  return false;
}

export function canAssign(role: Role) {
  return role === "ADMIN" || role === "WARDEN";
}

export function canUpdateWork(role: Role) {
  return isOps(role);
}

export function allowedTransitions(current: Status, role: Role): Status[] {
  if (isReporter(role)) {
    if (current === "RESOLVED") return ["CLOSED", "REOPENED"];
    return [];
  }
  if (current === "CLOSED") return [];
  if (role === "STAFF") {
    if (current === "REOPENED") return ["ASSIGNED", "IN_PROGRESS"];
    if (STAFF_QUEUE_STATUSES.includes(current)) return ["ASSIGNED"];
    if (current === "ASSIGNED") return ["IN_PROGRESS"];
    if (current === "IN_PROGRESS") return ["ON_HOLD", "RESOLVED"];
    if (current === "ON_HOLD") return ["IN_PROGRESS", "RESOLVED"];
    return [];
  }
  if (current === "SUBMITTED") return ["ACKNOWLEDGED", "ASSIGNED"];
  if (current === "ACKNOWLEDGED") return ["ASSIGNED"];
  if (current === "ASSIGNED" || current === "REOPENED") return ["IN_PROGRESS", "ASSIGNED"];
  if (current === "IN_PROGRESS") return ["ON_HOLD", "RESOLVED"];
  if (current === "ON_HOLD") return ["IN_PROGRESS", "RESOLVED"];
  return [];
}
