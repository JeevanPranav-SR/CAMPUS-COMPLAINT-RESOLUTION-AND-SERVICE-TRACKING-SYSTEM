export const ROLES = ["STUDENT", "FACULTY", "STAFF", "WARDEN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export function normalizeRole(role: string): Role {
  if (role === "DEPARTMENT_ADMIN") return "WARDEN";
  if (role === "SUPER_ADMIN") return "ADMIN";
  if ((ROLES as readonly string[]).includes(role)) return role as Role;
  return "STUDENT";
}

/** UG / MBA branches offered at Bannari Amman Institute of Technology, Sathyamangalam. */
export const DEPARTMENTS = [
  { code: "AIDS", name: "Artificial Intelligence and Data Science" },
  { code: "AIML", name: "Artificial Intelligence and Machine Learning" },
  { code: "Agri", name: "Agricultural Engineering" },
  { code: "BME", name: "Biomedical Engineering" },
  { code: "Biotech", name: "Biotechnology" },
  { code: "Civil", name: "Civil Engineering" },
  { code: "CSBS", name: "Computer Science and Business Systems" },
  { code: "CSD", name: "Computer Science and Design" },
  { code: "CSE", name: "Computer Science and Engineering" },
  { code: "CT", name: "Computer Technology" },
  { code: "ECE", name: "Electronics and Communication Engineering" },
  { code: "EEE", name: "Electrical and Electronics Engineering" },
  { code: "EIE", name: "Electronics and Instrumentation Engineering" },
  { code: "Fashion Tech", name: "Fashion Technology" },
  { code: "Food Tech", name: "Food Technology" },
  { code: "ISE", name: "Information Science and Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "MBA", name: "Master of Business Administration" },
  { code: "Mechanical", name: "Mechanical Engineering" },
  { code: "Mechatronics", name: "Mechatronics Engineering" },
  { code: "Textile", name: "Textile Technology" },
] as const;

export type DepartmentCode = (typeof DEPARTMENTS)[number]["code"];
const DEPARTMENT_CODES = new Set<string>(DEPARTMENTS.map((item) => item.code));

export function isDepartment(value: string): value is DepartmentCode {
  return DEPARTMENT_CODES.has(value);
}

export const COLLEGE_EMAIL_DOMAIN = "bitsathy.ac.in";

export function isCollegeEmail(email: string) {
  return email.toLowerCase().trim().endsWith(`@${COLLEGE_EMAIL_DOMAIN}`);
}

export const DEMO_ACCOUNTS = [
  { label: "Student (CSE)", email: `priya.s@${COLLEGE_EMAIL_DOMAIN}`, password: "student123" },
  { label: "Student (AIML)", email: `arjun.k@${COLLEGE_EMAIL_DOMAIN}`, password: "student123" },
  { label: "Student (AIDS)", email: `sneha.p@${COLLEGE_EMAIL_DOMAIN}`, password: "student123" },
  { label: "Student (IT)", email: `karthik.r@${COLLEGE_EMAIL_DOMAIN}`, password: "student123" },
  { label: "Faculty", email: `meena.k@${COLLEGE_EMAIL_DOMAIN}`, password: "faculty123" },
  { label: "Staff", email: `ramesh.m@${COLLEGE_EMAIL_DOMAIN}`, password: "staff123" },
  { label: "Warden", email: `lakshmi.w@${COLLEGE_EMAIL_DOMAIN}`, password: "warden123" },
  { label: "Estate admin", email: `admin@${COLLEGE_EMAIL_DOMAIN}`, password: "admin123" },
] as const;

export const STATUSES = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "ESCALATED",
  "REJECTED",
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
  ACKNOWLEDGED: { label: "Under review", tone: "blue" },
  ASSIGNED: { label: "Assigned", tone: "violet" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  ON_HOLD: { label: "On hold", tone: "orange" },
  ESCALATED: { label: "Escalated", tone: "red" },
  REJECTED: { label: "Rejected", tone: "red" },
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
  STUDENT: { label: "Student", blurb: "Raise and track your own campus complaints" },
  FACULTY: { label: "Faculty", blurb: "Raise and track your own campus complaints" },
  STAFF: { label: "Staff", blurb: "Raise complaints and work tickets assigned to you" },
  WARDEN: { label: "Warden", blurb: "Raise complaints and manage authorised hostel operations" },
  ADMIN: { label: "Estate admin", blurb: "Raise complaints and manage campus-wide service operations" },
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
