import { fail, ok, readJson } from "@/lib/http";
import { classifyComplaint, suggestPriority } from "@/lib/classify";
import { classifyDispatchExplanation, rankTechnicians } from "@/lib/dispatch";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);

  const parsed = await readJson<{ complaint_text?: string; location?: string | null; location_id?: string | null }>(request);
  if (!parsed.ok) return parsed.response;
  const text = parsed.value.complaint_text?.trim() ?? "";
  if (text.length < 5) return fail("VALIDATION", "Describe the complaint in at least 5 characters.", 400);

  const prediction = classifyComplaint(`${text} ${parsed.value.location ?? ""}`);
  const priority = suggestPriority(text);
  const dispatch = await rankTechnicians({
    category: prediction.category,
    priority,
    locationId: parsed.value.location_id ?? "",
    description: `${text} ${parsed.value.location ?? ""}`,
  });
  const pick = dispatch.pick;

  return ok({
    complaint_text: text,
    location: parsed.value.location?.trim() || null,
    predicted_category: prediction.label,
    category: prediction.category,
    unit: prediction.unit,
    department: dispatch.department,
    department_name: dispatch.departmentName,
    priority,
    confidence: prediction.confidence,
    assigned_worker_id: pick?.id ?? null,
    assigned_worker_name: pick?.name ?? null,
    pending: pick?.openCount ?? null,
    experience_years: pick?.experienceYears ?? null,
    specialty: pick?.specialty ?? null,
    difficulty: dispatch.difficulty.label,
    explanation: classifyDispatchExplanation({
      categoryLabel: prediction.label,
      departmentName: dispatch.departmentName,
      pick,
      difficulty: dispatch.difficulty.label,
    }),
  });
}
