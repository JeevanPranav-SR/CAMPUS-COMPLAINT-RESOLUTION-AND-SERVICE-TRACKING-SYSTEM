import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canSeeAll } from "@/lib/auth";
import { CATEGORIES, slaHours, type Priority } from "@/lib/constants";
import { CAMPUS_LOCATIONS, nearestLocation } from "@/lib/campus";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "default";

  const where =
    scope === "mine" || !canSeeAll(user.role)
      ? { reporterId: user.id }
      : scope === "assigned"
        ? { assigneeId: user.id }
        : user.role === "WARDEN"
          ? {
              OR: [
                { category: { in: ["HOSTEL", "MESS"] } },
                {
                  locationId: {
                    in: CAMPUS_LOCATIONS.filter((item) => item.zone.startsWith("hostel")).map((item) => item.id),
                  },
                },
              ],
            }
          : {};

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      reporter: { select: { id: true, name: true, role: true, department: true, hostel: true } },
      assignee: { select: { id: true, name: true, department: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    category?: string;
    priority?: Priority;
    locationId?: string;
    lat?: number;
    lng?: number;
    landmark?: string;
  };

  if (!body.title || !body.description || !body.category || !body.priority) {
    return NextResponse.json({ error: "Title, description, category and priority are required." }, { status: 400 });
  }

  if (!CATEGORIES.some((item) => item.id === body.category)) {
    return NextResponse.json({ error: "Unknown service category." }, { status: 400 });
  }

  const lat = body.lat ?? 11.4947151;
  const lng = body.lng ?? 77.277266;
  const nearest = nearestLocation(lat, lng);
  const locationId = body.locationId || nearest.id;
  const hours = slaHours(body.category, body.priority);
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.complaint.count();
  const ticketNo = `BIT-${year}-${String(count + 12).padStart(5, "0")}`;

  const complaint = await prisma.complaint.create({
    data: {
      ticketNo,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      status: "SUBMITTED",
      locationId,
      lat,
      lng,
      landmark: body.landmark || nearest.shortName,
      reporterId: user.id,
      slaHours: hours,
      dueAt: new Date(Date.now() + hours * 3600000),
      events: {
        create: {
          status: "SUBMITTED",
          note: `Filed from ${nearest.name}${body.landmark ? ` · ${body.landmark}` : ""}.`,
          actorId: user.id,
        },
      },
    },
    include: {
      reporter: { select: { id: true, name: true, role: true, department: true } },
      assignee: { select: { id: true, name: true, department: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({ complaint });
}
