import { after } from "next/server";
import { CATEGORIES, PRIORITIES, slaHours, type Priority } from "@/lib/constants";
import { fail, isAllowedImage, ok, readJson } from "@/lib/http";
import { notify, syncOverdueSlaNotifications } from "@/lib/notify";
import { writeAudit } from "@/lib/audit";
import { can, inUserDepartment, isForbiddenScope } from "@/lib/rbac";
import { departmentName, routeComplaint } from "@/lib/routing";
import { prisma } from "@/lib/prisma";
import { complaintScope, ticketInclude, ticketListSelect } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { allocateTicketNo } from "@/lib/tickets";
import { CAMPUS_LOCATIONS, nearestLocation } from "@/lib/campus";
import type { Prisma } from "@prisma/client";
import { normalizeRole, roleValues } from "@/lib/constants";

function searchWhere(q: string): Prisma.ComplaintWhereInput {
  const trimmed = q.trim();
  if (!trimmed) return {};
  const variants = new Set([
    trimmed,
    trimmed.replace(/[-_]+/g, " "),
    trimmed.replace(/[\s_]+/g, "-"),
    trimmed.replace(/[-_\s]+/g, ""),
  ]);
  if (/wifi/i.test(trimmed.replace(/[-_\s]/g, ""))) {
    variants.add("Wi-Fi");
    variants.add("wifi");
    variants.add("Wi Fi");
  }
  return {
    OR: [...variants].flatMap((term) => [
      { ticketNo: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ]),
  };
}

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  after(syncOverdueSlaNotifications);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const category = searchParams.get("category") ?? "";
  const assigneeId = searchParams.get("assigneeId") ?? "";
  const locationId = searchParams.get("locationId") ?? "";
  const scope = searchParams.get("scope") ?? "default";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("pageSize") ?? 12)));

  const whereScope = complaintScope(user, scope);
  if (isForbiddenScope(whereScope)) {
    return fail("FORBIDDEN", "You do not have permission to view those complaints.", 403);
  }

  const where: Prisma.ComplaintWhereInput = {
    AND: [
      whereScope,
      status ? { status } : {},
      priority ? { priority } : {},
      category ? { category } : {},
      assigneeId ? { assigneeId } : {},
      locationId ? { locationId } : {},
      from ? { createdAt: { gte: new Date(from) } } : {},
      to ? { createdAt: { lte: new Date(`${to}T23:59:59`) } } : {},
      q ? searchWhere(q) : {},
    ],
  };

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      select: ticketListSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok({ complaints, total, page, pageSize });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!can(user, "complaint:create")) {
    return fail("FORBIDDEN", "You do not have permission to raise a complaint.", 403);
  }

  const parsed = await readJson<{
    title?: string;
    description?: string;
    category?: string;
    priority?: Priority;
    locationId?: string;
    lat?: number;
    lng?: number;
    landmark?: string;
    evidence?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  if (title.length < 8 || title.length > 120) return fail("VALIDATION", "Title must be 8–120 characters.", 400);
  if (description.length < 20 || description.length > 2000) {
    return fail("VALIDATION", "Description must be 20–2000 characters.", 400);
  }
  if (!body.category || !CATEGORIES.some((item) => item.id === body.category)) {
    return fail("VALIDATION", "Select a valid category.", 400);
  }
  if (!body.priority || !PRIORITIES.includes(body.priority)) {
    return fail("VALIDATION", "Select a valid priority.", 400);
  }
  if (body.evidence && body.evidence.length > 1_800_000) {
    return fail("VALIDATION", "Attachment is too large (max ~1.2 MB).", 400);
  }
  if (body.evidence && !isAllowedImage(body.evidence)) {
    return fail("VALIDATION", "Only JPEG, PNG or WebP images are allowed.", 400);
  }

  const lat = body.lat;
  const lng = body.lng;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return fail("VALIDATION", "Pin the issue on the campus map.", 400);
  }

  const nearest = nearestLocation(lat, lng);
  const locationId = body.locationId && CAMPUS_LOCATIONS.some((item) => item.id === body.locationId)
    ? body.locationId
    : nearest.id;
  const hours = slaHours(body.category, body.priority);
  const department = routeComplaint(body.category, locationId);

  let complaint = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const ticketNo = await allocateTicketNo();
      complaint = await prisma.complaint.create({
        data: {
          ticketNo,
          title,
          description,
          category: body.category,
          priority: body.priority,
          status: "SUBMITTED",
          locationId,
          lat,
          lng,
          landmark: body.landmark?.trim() || nearest.shortName,
          evidence: body.evidence || null,
          reporterId: user.id,
          slaHours: hours,
          dueAt: new Date(Date.now() + hours * 3600000),
          events: {
            create: {
              status: "SUBMITTED",
              action: "STATUS",
              note: `Filed from ${nearest.name}${body.landmark ? ` · ${body.landmark}` : ""}. Auto-routed to ${departmentName(department)}.`,
              actorId: user.id,
            },
          },
        },
        include: ticketInclude,
      });
      break;
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2002" && attempt < 5) continue;
      if (code === "TICKET_ALLOCATION_FAILED" || (error instanceof Error && error.message === "TICKET_ALLOCATION_FAILED")) {
        return fail("CONFLICT", "Could not allocate a ticket number. Please try again.", 409);
      }
      throw error;
    }
  }
  if (!complaint) return fail("CONFLICT", "Could not allocate a ticket number. Please try again.", 409);

  const created = complaint;
  after(async () => {
    const supervisors = await prisma.user.findMany({
      where: { active: true, role: { in: [...roleValues("SUPER_ADMIN"), ...roleValues("DEPARTMENT_HEAD")] } },
      select: { id: true, role: true, hostel: true, department: true },
    });
    const recipients = supervisors
      .filter((item) => {
        const role = normalizeRole(item.role);
        if (role === "SUPER_ADMIN") return true;
        return inUserDepartment(item, created);
      })
      .map((item) => item.id);
    await Promise.all(
      recipients.map((userId) =>
        notify({
          userId,
          complaintId: created.id,
          actorId: user.id,
          title: `New ${departmentName(department)} complaint`,
          body: `${created.ticketNo}: ${created.title}`,
        }),
      ),
    );
    await notify({
      userId: user.id,
      complaintId: created.id,
      title: `${created.ticketNo} received`,
      body: `Your complaint was routed to ${departmentName(department)}. Track it with reference ${created.ticketNo}.`,
      external: true,
    });
    await writeAudit({
      actorId: user.id,
      action: "COMPLAINT_CREATE",
      entity: "Complaint",
      entityId: created.id,
      detail: `${created.ticketNo} submitted`,
    });
  });

  return ok({ complaint: { ...complaint, department, departmentName: departmentName(department) } }, 201);
}
