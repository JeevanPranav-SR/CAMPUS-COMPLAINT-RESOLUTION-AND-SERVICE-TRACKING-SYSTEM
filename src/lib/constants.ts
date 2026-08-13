export const ROLES = ["STUDENT", "FACULTY", "STAFF", "WARDEN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  { id: "ELECTRICAL", label: "Electrical", unit: "Electrical Maintenance", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "PLUMBING", label: "Plumbing / Water", unit: "Civil & Plumbing", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "CIVIL", label: "Civil / Infrastructure", unit: "Estate Office", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 } },
  { id: "HOUSEKEEPING", label: "Housekeeping", unit: "Housekeeping", sla: { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 48 } },
  { id: "IT_WIFI", label: "IT / Wi-Fi / Network", unit: "Data Centre", sla: { CRITICAL: 2, HIGH: 6, MEDIUM: 24, LOW: 48 } },
  { id: "HOSTEL", label: "Hostel Amenities", unit: "Office of the Warden", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "MESS", label: "Mess / Cafeteria", unit: "Student Centre & Mess", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 48 } },
  { id: "TRANSPORT", label: "Transport", unit: "Transport Office", sla: { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 72 } },
  { id: "SECURITY", label: "Security & Access", unit: "Security Office", sla: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 24 } },
  { id: "MEDICAL", label: "Medical Centre", unit: "Campus Medical Centre", sla: { CRITICAL: 1, HIGH: 2, MEDIUM: 8, LOW: 24 } },
  { id: "SPORTS", label: "Sports & Gym", unit: "Physical Education", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 } },
  { id: "ACADEMIC", label: "Classroom / Lab", unit: "Department Office", sla: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 72 } },
  { id: "OTHER", label: "Other Campus Service", unit: "Estate Office", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 48, LOW: 96 } },
] as const;

export const STATUS_META: Record<
  Status,
  { label: string; tone: string; step: number }
> = {
  SUBMITTED: { label: "Submitted", tone: "cyan", step: 1 },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "blue", step: 2 },
  ASSIGNED: { label: "Assigned", tone: "violet", step: 3 },
  IN_PROGRESS: { label: "In progress", tone: "amber", step: 4 },
  ON_HOLD: { label: "On hold", tone: "zinc", step: 4 },
  RESOLVED: { label: "Resolved", tone: "emerald", step: 5 },
  CLOSED: { label: "Closed", tone: "emerald", step: 6 },
};

export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "text-rose-300 bg-rose-500/15 border-rose-400/30" },
  HIGH: { label: "High", className: "text-amber-200 bg-amber-500/15 border-amber-400/30" },
  MEDIUM: { label: "Medium", className: "text-cyan-200 bg-cyan-500/15 border-cyan-400/30" },
  LOW: { label: "Low", className: "text-zinc-300 bg-zinc-500/15 border-zinc-400/30" },
};

export const ROLE_META: Record<Role, { label: string; blurb: string }> = {
  STUDENT: { label: "Student", blurb: "File and track campus services" },
  FACULTY: { label: "Faculty", blurb: "Report academic-block issues" },
  STAFF: { label: "Service staff", blurb: "Close assigned field tickets" },
  WARDEN: { label: "Warden", blurb: "Hostel & mess command" },
  ADMIN: { label: "Estate admin", blurb: "Campus-wide operations" },
};

export function slaHours(categoryId: string, priority: Priority) {
  const category = CATEGORIES.find((item) => item.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
  return category.sla[priority];
}

export function nextStatuses(current: Status, role: Role): Status[] {
  if (role === "STUDENT" || role === "FACULTY") {
    if (current === "RESOLVED") return ["CLOSED"];
    return [];
  }
  const flow: Record<Status, Status[]> = {
    SUBMITTED: ["ACKNOWLEDGED", "ASSIGNED"],
    ACKNOWLEDGED: ["ASSIGNED", "IN_PROGRESS"],
    ASSIGNED: ["IN_PROGRESS", "ON_HOLD"],
    IN_PROGRESS: ["ON_HOLD", "RESOLVED"],
    ON_HOLD: ["IN_PROGRESS", "RESOLVED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
  };
  return flow[current];
}
