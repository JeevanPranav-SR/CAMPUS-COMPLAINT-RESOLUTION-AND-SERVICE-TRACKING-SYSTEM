import { fail, ok, readJson } from "@/lib/http";
import { notify } from "@/lib/notify";
import { can, canViewComplaint } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ticketInclude } from "@/lib/queries";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  const { id } = await params;
  const parsed = await readJson<{ body?: string }>(request);
  if (!parsed.ok) return parsed.response;
  const text = parsed.value.body?.trim() ?? "";
  if (text.length < 2 || text.length > 1000) return fail("VALIDATION", "Comment must be 2–1000 characters.", 400);

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return fail("NOT_FOUND", "Complaint not found.", 404);
  if (!canViewComplaint(user, complaint)) return fail("FORBIDDEN", "You cannot comment on this complaint.", 403);
  if (!can(user, "complaint:comment")) return fail("FORBIDDEN", "You cannot comment on this complaint.", 403);

  await prisma.comment.create({ data: { complaintId: id, actorId: user.id, body: text } });
  await prisma.timelineEvent.create({
    data: {
      complaintId: id,
      actorId: user.id,
      status: complaint.status,
      action: "COMMENT",
      note: text,
    },
  });

  const targets = [complaint.reporterId, complaint.assigneeId].filter(Boolean) as string[];
  await Promise.all(
    targets.map((userId) =>
      notify({
        userId,
        complaintId: id,
        actorId: user.id,
        title: `New comment on ${complaint.ticketNo}`,
        body: text.slice(0, 140),
      }),
    ),
  );

  const updated = await prisma.complaint.findUnique({ where: { id }, include: ticketInclude });
  return ok({ complaint: updated });
}
