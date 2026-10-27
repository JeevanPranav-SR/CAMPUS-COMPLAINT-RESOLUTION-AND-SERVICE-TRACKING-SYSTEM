import type { Prisma } from "@prisma/client";
import { CAMPUS_LOCATIONS } from "./campus";

export const OPS_DEPARTMENTS = [
  { id: "IT_INFRASTRUCTURE", name: "IT Infrastructure", categories: ["IT_WIFI"] },
  { id: "ELECTRICAL", name: "Electrical", categories: ["ELECTRICAL"] },
  {
    id: "FACILITIES",
    name: "Facilities / Civil",
    categories: ["PLUMBING", "WATER", "CIVIL", "FURNITURE", "HOUSEKEEPING", "ACADEMIC", "TRANSPORT", "SECURITY", "MEDICAL", "SPORTS", "OTHER"],
  },
  { id: "HOSTEL", name: "Hostel Maintenance", categories: ["HOSTEL", "MESS"] },
] as const;

export type OpsDepartmentId = (typeof OPS_DEPARTMENTS)[number]["id"];

export const HOSTEL_LOCATION_IDS = CAMPUS_LOCATIONS.filter((item) => item.zone.startsWith("hostel")).map((item) => item.id);

const FACILITIES_CATEGORIES: string[] = [...OPS_DEPARTMENTS[2].categories];
const HOSTEL_CATEGORIES: string[] = [...OPS_DEPARTMENTS[3].categories];

/** Department names used by earlier seeds and the user directory. */
const DEPARTMENT_ALIASES: Record<string, OpsDepartmentId> = {
  "it infrastructure": "IT_INFRASTRUCTURE",
  "data centre": "IT_INFRASTRUCTURE",
  electrical: "ELECTRICAL",
  "electrical maintenance": "ELECTRICAL",
  "facilities / civil": "FACILITIES",
  "civil & plumbing": "FACILITIES",
  "estate office": "FACILITIES",
  housekeeping: "FACILITIES",
  "hostel maintenance": "HOSTEL",
  "office of the warden": "HOSTEL",
};

export function opsDepartment(id: string | null | undefined) {
  return OPS_DEPARTMENTS.find((item) => item.id === id) ?? null;
}

export function opsDepartmentOf(department: string | null | undefined): OpsDepartmentId | null {
  if (!department) return null;
  const byId = OPS_DEPARTMENTS.find((item) => item.id === department);
  if (byId) return byId.id;
  return DEPARTMENT_ALIASES[department.trim().toLowerCase()] ?? null;
}

/**
 * Hostel Maintenance owns everything raised inside a hostel except specialist work
 * (electrical and IT), which always goes to the campus-wide specialist teams.
 */
export function routeComplaint(category: string, locationId: string): OpsDepartmentId {
  if (HOSTEL_CATEGORIES.includes(category)) return "HOSTEL";
  if (HOSTEL_LOCATION_IDS.includes(locationId) && FACILITIES_CATEGORIES.includes(category)) return "HOSTEL";
  const match = OPS_DEPARTMENTS.find((item) => (item.categories as readonly string[]).includes(category));
  return match?.id ?? "FACILITIES";
}

export function departmentName(id: OpsDepartmentId) {
  return opsDepartment(id)?.name ?? id;
}

export function departmentWhere(id: OpsDepartmentId): Prisma.ComplaintWhereInput {
  if (id === "HOSTEL") {
    return {
      OR: [
        { category: { in: HOSTEL_CATEGORIES } },
        { category: { in: FACILITIES_CATEGORIES }, locationId: { in: HOSTEL_LOCATION_IDS } },
      ],
    };
  }
  if (id === "FACILITIES") {
    return { category: { in: FACILITIES_CATEGORIES }, locationId: { notIn: HOSTEL_LOCATION_IDS } };
  }
  return { category: { in: [...(opsDepartment(id)?.categories ?? [])] } };
}
