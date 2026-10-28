import { roleValues } from "./constants";
import { prisma } from "./prisma";
import { departmentName, opsDepartmentOf, routeComplaint, type OpsDepartmentId } from "./routing";
import { SPECIALTIES, specialtyLabel } from "./specialties";

const DONE = ["RESOLVED", "CLOSED", "REJECTED"];

export function difficultyOf(priority: string, text = "") {
  const haystack = text.toLowerCase();
  if (priority === "CRITICAL" || /(fire|injured|collapse|electrocute|flooded)/.test(haystack)) {
    return { level: 4 as const, label: "critical" };
  }
  if (priority === "HIGH") return { level: 3 as const, label: "high-difficulty" };
  if (priority === "LOW") return { level: 1 as const, label: "routine" };
  return { level: 2 as const, label: "standard" };
}

function experienceFit(years: number, level: number) {
  const bands: Record<number, [number, number]> = {
    1: [0, 3],
    2: [3, 8],
    3: [7, 15],
    4: [10, 40],
  };
  const [min, max] = bands[level] ?? [3, 8];
  if (years >= min && years <= max) return 1;
  if (years > max) return 0.72;
  return Math.max(0.18, 1 - (min - years) * 0.16);
}

function specialtyScore(specialty: string | null, category: string, text: string, routed: OpsDepartmentId) {
  const spec = SPECIALTIES.find((item) => item.id === specialty);
  if (!spec) return 0.4;
  if (specialty === "HVAC" && /(ac|a\/c|air\s?cond)/i.test(text)) return 1;
  if ((spec.categories as readonly string[]).includes(category)) return 1;
  if ((spec.departments as readonly string[]).includes(routed)) return 0.55;
  return 0.15;
}

function availabilityScore(openCount: number) {
  if (openCount <= 0) return 1;
  if (openCount === 1) return 0.78;
  if (openCount === 2) return 0.55;
  if (openCount === 3) return 0.32;
  return 0.12;
}

export type DispatchCandidate = {
  id: string;
  name: string;
  department: string | null;
  specialty: string | null;
  experienceYears: number;
  openCount: number;
  similarResolved: number;
  avgRating: number | null;
  score: number;
  reasons: string[];
};

export type DispatchResult = {
  department: OpsDepartmentId;
  departmentName: string;
  difficulty: ReturnType<typeof difficultyOf>;
  ranked: DispatchCandidate[];
  pick: DispatchCandidate | null;
};

export async function rankTechnicians(input: {
  category: string;
  priority: string;
  locationId: string;
  description?: string;
}): Promise<DispatchResult> {
  const department = routeComplaint(input.category, input.locationId);
  const difficulty = difficultyOf(input.priority, input.description);
  const technicians = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: roleValues("TECHNICIAN") },
      department: departmentName(department),
    },
    select: {
      id: true,
      name: true,
      department: true,
      specialty: true,
      experienceYears: true,
      assigned: {
        select: { status: true, category: true, assignedAt: true, rating: true },
      },
    },
  });

  const now = Date.now();
  const ranked = technicians
    .filter((person) => opsDepartmentOf(person.department) === department)
    .map((person) => {
      const open = person.assigned.filter((ticket) => !DONE.includes(ticket.status));
      const done = person.assigned.filter((ticket) => ticket.status === "CLOSED" || ticket.status === "RESOLVED");
      const similar = done.filter((ticket) => ticket.category === input.category);
      const ratings = done.map((ticket) => ticket.rating).filter((value): value is number => typeof value === "number");
      const avgRating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
      const lastAssigned = open
        .map((ticket) => ticket.assignedAt)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const spec = specialtyScore(person.specialty, input.category, input.description ?? "", department);
      const experience = experienceFit(person.experienceYears, difficulty.level);
      const free = availabilityScore(open.length);
      const history = Math.min(1, similar.length * 0.18 + (avgRating ? (avgRating / 5) * 0.35 : 0.12));
      const recentPenalty = lastAssigned && now - lastAssigned.getTime() < 2 * 3600_000 ? 0.08 : 0;
      const score = Number((spec * 0.34 + experience * 0.26 + free * 0.25 + history * 0.15 - recentPenalty).toFixed(3));

      const reasons = [
        `${specialtyLabel(person.specialty)}, ${person.experienceYears} yr${person.experienceYears === 1 ? "" : "s"} experience`,
        open.length === 0 ? "currently free" : `${open.length} open ticket${open.length === 1 ? "" : "s"}`,
      ];
      if (similar.length) reasons.push(`${similar.length} similar job${similar.length === 1 ? "" : "s"} completed`);
      if (avgRating) reasons.push(`avg rating ${avgRating.toFixed(1)}/5`);

      return {
        id: person.id,
        name: person.name,
        department: person.department,
        specialty: person.specialty,
        experienceYears: person.experienceYears,
        openCount: open.length,
        similarResolved: similar.length,
        avgRating,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score || a.openCount - b.openCount || a.name.localeCompare(b.name));

  return {
    department,
    departmentName: departmentName(department),
    difficulty,
    ranked,
    pick: ranked[0] ?? null,
  };
}

export function dispatchNote(pick: DispatchCandidate, difficultyLabel: string, department: string) {
  return `AI dispatch assigned ${pick.name} for this ${difficultyLabel} ${department} job (${pick.reasons.join("; ")}).`;
}

export function classifyDispatchExplanation(input: {
  categoryLabel: string;
  departmentName: string;
  pick: DispatchCandidate | null;
  difficulty: string;
}) {
  if (!input.pick) {
    return `${input.categoryLabel} work is routed to ${input.departmentName}. No matching technician is free yet, so the department head will assign one.`;
  }
  return `AI will auto-assign this ${input.difficulty} ${input.categoryLabel} job to ${input.pick.name} (${input.pick.reasons.join("; ")}).`;
}

