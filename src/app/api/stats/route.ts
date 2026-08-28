import { getLocation } from "@/lib/campus";
import { fail, ok } from "@/lib/http";
import { syncOverdueSlaNotifications } from "@/lib/notify";
import { analyticsScope, canAny } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!canAny(user, ["analytics:view", "analytics:view_hostel"])) {
    return fail("FORBIDDEN", "Operational analytics are not available for this role.", 403);
  }

  await syncOverdueSlaNotifications();

  const where = analyticsScope(user);
  if (!where) return fail("FORBIDDEN", "Operational analytics are not available for this role.", 403);

  const complaints = await prisma.complaint.findMany({
    where,
    include: { assignee: { select: { id: true, name: true, department: true } } },
  });

  const open = complaints.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
  const resolved = complaints.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status));
  const breached = open.filter((item) => item.dueAt.getTime() < Date.now());
  const critical = open.filter((item) => item.priority === "CRITICAL" || item.priority === "HIGH");
  const slaMet = resolved.filter((item) => item.resolvedAt && item.resolvedAt.getTime() <= item.dueAt.getTime());

  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byLocation: Record<string, { id: string; name: string; count: number; open: number; overdue: number; high: number; lat: number; lng: number }> = {};
  const byDayMap: Record<string, number> = {};

  for (const item of complaints) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
    const day = item.createdAt.toISOString().slice(0, 10);
    byDayMap[day] = (byDayMap[day] ?? 0) + 1;
    const location = getLocation(item.locationId);
    if (!byLocation[item.locationId]) {
      byLocation[item.locationId] = {
        id: item.locationId,
        name: location?.shortName ?? item.locationId,
        count: 0,
        open: 0,
        overdue: 0,
        high: 0,
        lat: item.lat,
        lng: item.lng,
      };
    }
    const bucket = byLocation[item.locationId];
    bucket.count += 1;
    if (!["RESOLVED", "CLOSED"].includes(item.status)) {
      bucket.open += 1;
      if (item.dueAt.getTime() < Date.now()) bucket.overdue += 1;
      if (item.priority === "HIGH" || item.priority === "CRITICAL") bucket.high += 1;
    }
  }

  const hours = resolved
    .filter((item) => item.resolvedAt)
    .map((item) => (item.resolvedAt!.getTime() - item.createdAt.getTime()) / 3600000);
  const avgResolution = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;

  const staffWhere = user.role === "STAFF" ? { id: user.id } : { role: "STAFF" };
  const staff = await prisma.user.findMany({
    where: staffWhere,
    select: { id: true, name: true, department: true },
  });
  const workload = staff.map((person) => {
    const mine = complaints.filter((item) => item.assigneeId === person.id);
    const openMine = mine.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
    const done = mine.filter((item) => item.resolvedAt);
    const avgHours = done.length
      ? done.reduce((sum, item) => sum + (item.resolvedAt!.getTime() - item.createdAt.getTime()) / 3600000, 0) /
        done.length
      : 0;
    return {
      id: person.id,
      name: person.name,
      department: person.department,
      assigned: openMine.length,
      inProgress: mine.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: mine.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
      overdue: openMine.filter((item) => item.dueAt.getTime() < Date.now()).length,
      avgHours: Number(avgHours.toFixed(1)),
    };
  });

  const byDay = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, count]) => ({ day: day.slice(5), count }));

  return ok({
    totals: {
      all: complaints.length,
      open: open.length,
      resolved: resolved.length,
      breached: breached.length,
      critical: critical.length,
      avgResolution: Number(avgResolution.toFixed(1)),
      slaCompliance: resolved.length ? Math.round((slaMet.length / resolved.length) * 100) : 0,
    },
    byCategory,
    byStatus,
    byPriority,
    byDay,
    hotspots: Object.values(byLocation).sort((a, b) => b.open - a.open || b.count - a.count).slice(0, 8),
    workload,
  });
}
