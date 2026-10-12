import { fail, ok, readJson } from "@/lib/http";
import { allocationExplanation, classifyComplaint, staffMatchesCategory, suggestPriority } from "@/lib/classify";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canAssign } from "@/lib/rbac";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);

  const parsed = await readJson<{ complaint_text?: string; location?: string | null }>(request);
  if (!parsed.ok) return parsed.response;
  const text = parsed.value.complaint_text?.trim() ?? "";
  if (text.length < 5) return fail("VALIDATION", "Describe the complaint in at least 5 characters.", 400);

  const prediction = classifyComplaint(`${text} ${parsed.value.location ?? ""}`);
  const priority = suggestPriority(text);

  const staff = await prisma.user.findMany({
    where: { active: true, role: "STAFF" },
    select: {
      id: true,
      name: true,
      department: true,
      assigned: {
        where: { status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] } },
        select: { id: true },
      },
    },
  });

  const eligible = staff
    .filter((person) => staffMatchesCategory(person.department, prediction.category))
    .map((person) => ({
      id: person.id,
      name: person.name,
      department: person.department,
      pending: person.assigned.length,
    }))
    .sort((a, b) => a.pending - b.pending || a.name.localeCompare(b.name));

  const worker = eligible[0] ?? null;
  const showWorker = Boolean(worker && canAssign(user));

  return ok({
    complaint_text: text,
    location: parsed.value.location?.trim() || null,
    predicted_category: prediction.label,
    category: prediction.category,
    unit: prediction.unit,
    priority,
    confidence: prediction.confidence,
    assigned_worker_id: showWorker ? worker?.id ?? null : null,
    assigned_worker_name: showWorker ? worker?.name ?? null : null,
    pending: showWorker ? worker?.pending ?? null : null,
    explanation: allocationExplanation({
      categoryLabel: prediction.label,
      unit: prediction.unit,
      workerName: showWorker ? worker?.name : null,
      pending: worker?.pending,
    }),
  });
}
