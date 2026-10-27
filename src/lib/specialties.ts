export const SPECIALTIES = [
  { id: "ELECTRICIAN", label: "Electrician", departments: ["ELECTRICAL"], categories: ["ELECTRICAL"] },
  { id: "NETWORK", label: "Network technician", departments: ["IT_INFRASTRUCTURE"], categories: ["IT_WIFI"] },
  { id: "PLUMBER", label: "Plumber", departments: ["FACILITIES", "HOSTEL"], categories: ["PLUMBING", "WATER"] },
  { id: "CIVIL", label: "Civil technician", departments: ["FACILITIES"], categories: ["CIVIL", "FURNITURE", "ACADEMIC"] },
  { id: "HVAC", label: "HVAC technician", departments: ["FACILITIES"], categories: ["CIVIL"] },
  { id: "HOUSEKEEPING", label: "Housekeeping", departments: ["FACILITIES", "HOSTEL"], categories: ["HOUSEKEEPING", "MESS"] },
  { id: "HOSTEL_MAINT", label: "Hostel maintenance", departments: ["HOSTEL"], categories: ["HOSTEL", "MESS", "PLUMBING", "WATER", "FURNITURE"] },
  { id: "GENERAL", label: "General facilities", departments: ["FACILITIES"], categories: ["TRANSPORT", "SECURITY", "SPORTS", "MEDICAL", "OTHER"] },
] as const;

export type SpecialtyId = (typeof SPECIALTIES)[number]["id"];

export function specialtyLabel(id: string | null | undefined) {
  return SPECIALTIES.find((item) => item.id === id)?.label ?? "General technician";
}

export function staffOptionLabel(person: {
  name: string;
  specialty?: string | null;
  experienceYears?: number | null;
}) {
  const bits = [person.name];
  if (person.specialty) bits.push(specialtyLabel(person.specialty));
  if (typeof person.experienceYears === "number" && person.experienceYears > 0) {
    bits.push(`${person.experienceYears} yr${person.experienceYears === 1 ? "" : "s"}`);
  }
  return bits.join(" · ");
}
