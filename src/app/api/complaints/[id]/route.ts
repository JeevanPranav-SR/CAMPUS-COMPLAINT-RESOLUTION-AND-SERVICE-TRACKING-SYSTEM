import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canSeeAll } from "@/lib/auth";
import { nextStatuses, type Status } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, role: true, department: true, hostel: true, registerNo: true } },
      assignee: { select: { id: true, name: true, department: true, role: true } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true, role: true } } } },
    },
  });

  if (!complaint) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (!canSeeAll(user.role) && complaint.reporterId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "WARDEN", "ADMIN"] } },
    select: { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ complaint, staff });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as {
    status?: Status;
    assigneeId?: string | null;
    note?: string;
    rating?: number;
  };

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const allowed = nextStatuses(existing.status as Status, user.role);
  if (body.status && !allowed.includes(body.status) && user.role !== "ADMIN") {
    return NextResponse.json({ error: "That status transition is not allowed for your role." }, { status: 400 });
  }

  if (body.assigneeId && !canSeeAll(user.role)) {
    return NextResponse.json({ error: "Only operations staff can assign tickets." }, { status: 403 });
  }

  const nextStatus = body.status ?? (body.assigneeId && existing.status === "SUBMITTED" ? "ASSIGNED" : existing.status);
  const resolvedAt =
    nextStatus === "RESOLVED" && !existing.resolvedAt
      ? new Date()
      : nextStatus === "CLOSED"
        ? existing.resolvedAt ?? new Date()
        : existing.resolvedAt;

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status: nextStatus,
      assigneeId: body.assigneeId === undefined ? existing.assigneeId : body.assigneeId,
      rating: body.rating ?? existing.rating,
      resolvedAt,
      events: {
        create: {
          status: nextStatus,
          note: body.note || `Status → ${nextStatus.replace(/_/g, " ").toLowerCase()}.`,
          actorId: user.id,
        },
      },
    },
    include: {
      reporter: { select: { id: true, name: true, role: true, department: true } },
      assignee: { select: { id: true, name: true, department: true } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ complaint });
}
