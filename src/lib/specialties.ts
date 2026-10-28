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

export function specialtiesForJob(category: string, department: string, text = "") {
  if (/(ac|a\/c|air\s?cond)/i.test(text)) return ["HVAC"] as SpecialtyId[];
  return SPECIALTIES.filter(
    (item) =>
      item.id !== "HVAC" &&
      (item.categories as readonly string[]).includes(category) &&
      (item.departments as readonly string[]).includes(department),
  ).map((item) => item.id);
}

export function sortStaff<T extends { name: string; specialty?: string | null; experienceYears?: number | null }>(people: T[]) {
  return [...people].sort(
    (a, b) =>
      specialtyLabel(a.specialty).localeCompare(specialtyLabel(b.specialty)) ||
      (b.experienceYears ?? 0) - (a.experienceYears ?? 0) ||
      a.name.localeCompare(b.name),
  );
}

export function staffForTicket<T extends { id: string; name: string; specialty?: string | null; experienceYears?: number | null }>(
  people: T[],
  category: string,
  department: string,
  text = "",
  currentId?: string | null,
) {
  const wanted = new Set(specialtiesForJob(category, department, text));
  const matching = people.filter(
    (person) => (person.specialty && wanted.has(person.specialty as SpecialtyId)) || person.id === currentId,
  );
  return sortStaff(matching.length ? matching : people);
}

export function groupStaffBySpecialty<T extends { specialty?: string | null }>(people: T[]) {
  const groups: { label: string; members: T[] }[] = [];
  const index = new Map<string, number>();
  for (const person of people) {
    const label = specialtyLabel(person.specialty);
    const existing = index.get(label);
    if (existing == null) {
      index.set(label, groups.length);
      groups.push({ label, members: [person] });
    } else {
      groups[existing].members.push(person);
    }
  }
  return groups;
}
