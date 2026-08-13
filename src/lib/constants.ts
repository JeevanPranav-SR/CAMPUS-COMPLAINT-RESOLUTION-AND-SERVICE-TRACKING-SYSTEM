export const ROLES = ["STUDENT", "FACULTY", "STAFF", "WARDEN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  { id: "ELECTRICAL", label: "Electrical", unit: "Electrical Maintenance", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "PLUMBING", label: "Plumbing", unit: "Civil & Plumbing", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "WATER", label: "Water supply", unit: "Civil & Plumbing", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "CIVIL", label: "Civil / Infrastructure", unit: "Estate Office", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 } },
  { id: "HOUSEKEEPING", label: "Cleaning", unit: "Housekeeping", sla: { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 48 } },
  { id: "IT_WIFI", label: "Internet / Wi-Fi", unit: "Data Centre", sla: { CRITICAL: 2, HIGH: 6, MEDIUM: 24, LOW: 48 } },
  { id: "HOSTEL", label: "Hostel", unit: "Office of the Warden", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 } },
  { id: "MESS", label: "Mess / Cafeteria", unit: "Student Centre & Mess", sla: { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 48 } },
  { id: "FURNITURE", label: "Furniture", unit: "Estate Office", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 } },
  { id: "ACADEMIC", label: "Classroom / Lab", unit: "Department Office", sla: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 72 } },
  { id: "TRANSPORT", label: "Transport", unit: "Transport Office", sla: { CRITICAL: 6, HIGH: 12, MEDIUM: 24, LOW: 72 } },
  { id: "SECURITY", label: "Security", unit: "Security Office", sla: { CRITICAL: 1, HIGH: 4, MEDIUM: 12, LOW: 24 } },
  { id: "MEDICAL", label: "Medical Centre", unit: "Campus Medical Centre", sla: { CRITICAL: 1, HIGH: 2, MEDIUM: 8, LOW: 24 } },
  { id: "SPORTS", label: "Sports & Gym", unit: "Physical Education", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 } },
  { id: "OTHER", label: "Other", unit: "Estate Office", sla: { CRITICAL: 8, HIGH: 24, MEDIUM: 48, LOW: 96 } },
] as const;

export const STATUS_META: Record<Status, { label: string; tone: "slate" | "blue" | "violet" | "amber" | "green" | "red" | "orange" }> = {
  SUBMITTED: { label: "Submitted", tone: "slate" },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "blue" },
  ASSIGNED: { label: "Assigned", tone: "violet" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  ON_HOLD: { label: "On hold", tone: "orange" },
  RESOLVED: { label: "Resolved", tone: "green" },
  REOPENED: { label: "Reopened", tone: "red" },
  CLOSED: { label: "Closed", tone: "green" },
};

export const PRIORITY_META: Record<Priority, { label: string; tone: "red" | "amber" | "blue" | "slate" }> = {
  CRITICAL: { label: "Critical", tone: "red" },
  HIGH: { label: "High", tone: "amber" },
  MEDIUM: { label: "Medium", tone: "blue" },
  LOW: { label: "Low", tone: "slate" },
};

export const ROLE_META: Record<Role, { label: string; blurb: string }> = {
  STUDENT: { label: "Student", blurb: "Report and track campus service issues" },
  FACULTY: { label: "Faculty", blurb: "Report academic-block issues" },
  STAFF: { label: "Staff", blurb: "Work assigned field tickets" },
  WARDEN: { label: "Warden", blurb: "Hostel and residential operations" },
  ADMIN: { label: "Estate admin", blurb: "Campus-wide service operations" },
};

export const LIFECYCLE: Status[] = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export function slaHours(categoryId: string, priority: Priority) {
  const category = CATEGORIES.find((item) => item.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
  return category.sla[priority];
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((item) => item.id === id)?.label ?? id;
}
