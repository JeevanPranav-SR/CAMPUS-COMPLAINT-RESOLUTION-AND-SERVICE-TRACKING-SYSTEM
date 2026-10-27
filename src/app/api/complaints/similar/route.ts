import { categoryLabel, CATEGORIES, STATUS_META, type Status } from "@/lib/constants";
import { getLocation } from "@/lib/campus";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canViewComplaint } from "@/lib/rbac";
import { departmentName, routeComplaint } from "@/lib/routing";
import { getSession } from "@/lib/session";

const RADIUS_METERS = 150;
const WINDOW_DAYS = 30;
const OPEN_STATUSES = ["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "ESCALATED", "REOPENED"];

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/**
 * Duplicate-aware intake: before filing, tell the reporter whether the same
 * problem is already being handled nearby. Only tickets the caller may view
 * expose their title and link; others are reported as anonymous counts.
 */
export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "";
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!CATEGORIES.some((item) => item.id === category) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return fail("VALIDATION", "Category and map position are required.", 400);
  }

  const candidates = await prisma.complaint.findMany({
    where: {
      category,
      createdAt: { gte: new Date(Date.now() - WINDOW_DAYS * 24 * 3600000) },
    },
    select: {
      id: true,
      ticketNo: true,
      title: true,
      status: true,
      category: true,
      locationId: true,
      lat: true,
      lng: true,
      reporterId: true,
      assigneeId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const nearby = candidates
    .map((item) => ({ item, distance: distanceMeters(lat, lng, item.lat, item.lng) }))
    .filter(({ distance }) => distance <= RADIUS_METERS);

  const open = nearby.filter(({ item }) => OPEN_STATUSES.includes(item.status));
  const recentlyFixed = nearby.filter(({ item }) => ["RESOLVED", "CLOSED"].includes(item.status)).length;

  return ok({
    category: categoryLabel(category),
    radiusMeters: RADIUS_METERS,
    windowDays: WINDOW_DAYS,
    openCount: open.length,
    recentlyFixed,
    recurring: recentlyFixed >= 1 && open.length === 0,
    matches: open
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ item, distance }) => {
        const visible = canViewComplaint(user, item);
        return {
          id: visible ? item.id : null,
          ticketNo: visible ? item.ticketNo : null,
          title: visible ? item.title : null,
          mine: item.reporterId === user.id,
          status: STATUS_META[item.status as Status]?.label ?? item.status,
          place: getLocation(item.locationId)?.shortName ?? item.locationId,
          department: departmentName(routeComplaint(item.category, item.locationId)),
          distanceMeters: Math.round(distance),
          ageHours: Math.round((Date.now() - item.createdAt.getTime()) / 3600000),
        };
      }),
  });
}
