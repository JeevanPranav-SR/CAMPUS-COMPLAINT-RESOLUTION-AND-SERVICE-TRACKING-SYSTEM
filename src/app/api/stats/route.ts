import { after } from "next/server";
import { getLocation } from "@/lib/campus";
import { categoryLabel, roleValues } from "@/lib/constants";
import { fail, ok } from "@/lib/http";
import { syncOverdueSlaNotifications } from "@/lib/notify";
import { analyticsScope, can, canAny } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { OPS_DEPARTMENTS, opsDepartmentOf, routeComplaint } from "@/lib/routing";
import { getSession } from "@/lib/session";

const DONE = ["RESOLVED", "CLOSED"];
const HOUR = 3600000;
const RECURRING_WINDOW_DAYS = 90;

function average(values: number[]) {
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(value.toFixed(1));
}

function percent(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function weekStart(date: Date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export async function GET() {
  const user = await getSession();
  if (!user) return fail("UNAUTHENTICATED", "Sign in required.", 401);
  if (!canAny(user, ["analytics:view", "analytics:view_department"])) {
    return fail("FORBIDDEN", "Operational analytics are not available for this role.", 403);
  }

  after(syncOverdueSlaNotifications);

  const where = analyticsScope(user);
  if (!where) return fail("FORBIDDEN", "Operational analytics are not available for this role.", 403);

  const complaints = await prisma.complaint.findMany({
    where,
    select: {
      id: true,
      ticketNo: true,
      category: true,
      priority: true,
      status: true,
      locationId: true,
      lat: true,
      lng: true,
      assigneeId: true,
      dueAt: true,
      createdAt: true,
      acknowledgedAt: true,
      assignedAt: true,
      resolvedAt: true,
      reopenCount: true,
      rating: true,
      ratingComment: true,
    },
  });
  const now = Date.now();

  const isDone = (status: string) => DONE.includes(status);
  const open = complaints.filter((item) => !isDone(item.status) && item.status !== "REJECTED");
  const resolved = complaints.filter((item) => isDone(item.status));
  const breached = open.filter((item) => item.dueAt.getTime() < now);
  const critical = open.filter((item) => item.priority === "CRITICAL" || item.priority === "HIGH");
  const slaMet = resolved.filter((item) => item.resolvedAt && item.resolvedAt.getTime() <= item.dueAt.getTime());

  const resolutionHours = (item: (typeof complaints)[number]) =>
    item.resolvedAt ? (item.resolvedAt.getTime() - item.createdAt.getTime()) / HOUR : null;
  const firstResponseHours = (item: (typeof complaints)[number]) => {
    const first = [item.acknowledgedAt, item.assignedAt]
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return first ? (first.getTime() - item.createdAt.getTime()) / HOUR : null;
  };

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
    byLocation[item.locationId] ??= {
      id: item.locationId,
      name: location?.shortName ?? item.locationId,
      count: 0,
      open: 0,
      overdue: 0,
      high: 0,
      lat: item.lat,
      lng: item.lng,
    };
    const bucket = byLocation[item.locationId];
    bucket.count += 1;
    if (!isDone(item.status)) {
      bucket.open += 1;
      if (item.dueAt.getTime() < now) bucket.overdue += 1;
      if (item.priority === "HIGH" || item.priority === "CRITICAL") bucket.high += 1;
    }
  }

  const resolvedHours = resolved.map(resolutionHours).filter((value): value is number => value !== null);
  const responseHours = complaints.map(firstResponseHours).filter((value): value is number => value !== null);
  const speedBuckets = [
    { label: "< 1 day", max: 24 },
    { label: "1–3 days", max: 72 },
    { label: "3–7 days", max: 168 },
    { label: "> 7 days", max: Infinity },
  ].map((bucket, index, all) => ({
    label: bucket.label,
    count: resolvedHours.filter((value) => value < bucket.max && (index === 0 || value >= all[index - 1].max)).length,
  }));

  const departments = OPS_DEPARTMENTS.map((department) => {
    const items = complaints.filter((item) => routeComplaint(item.category, item.locationId) === department.id);
    const done = items.filter((item) => isDone(item.status));
    const responded = items.filter((item) => firstResponseHours(item) !== null || isDone(item.status));
    const within24 = items.filter((item) => {
      const hours = firstResponseHours(item);
      return hours !== null && hours <= 24;
    });
    const ratings = items.map((item) => item.rating).filter((value): value is number => typeof value === "number");
    return {
      id: department.id,
      name: department.name,
      total: items.length,
      open: items.filter((item) => !isDone(item.status) && item.status !== "REJECTED").length,
      resolved: done.length,
      resolutionRate: percent(done.length, items.length),
      responseRate: percent(responded.length, items.length),
      respondedWithin24h: percent(within24.length, items.length),
      avgResponseHours: average(items.map(firstResponseHours).filter((value): value is number => value !== null)),
      avgResolutionHours: average(done.map(resolutionHours).filter((value): value is number => value !== null)),
      slaCompliance: percent(
        done.filter((item) => item.resolvedAt && item.resolvedAt.getTime() <= item.dueAt.getTime()).length,
        done.length,
      ),
      avgRating: average(ratings),
      ratings: ratings.length,
    };
  }).filter((department) => department.total > 0);

  const recentCutoff = now - RECURRING_WINDOW_DAYS * 24 * HOUR;
  const recurringMap = new Map<string, { locationId: string; category: string; count: number; open: number; reopened: number; lastAt: Date }>();
  for (const item of complaints) {
    if (item.createdAt.getTime() < recentCutoff) continue;
    const key = `${item.locationId}|${item.category}`;
    const entry = recurringMap.get(key) ?? { locationId: item.locationId, category: item.category, count: 0, open: 0, reopened: 0, lastAt: item.createdAt };
    entry.count += 1;
    if (!isDone(item.status)) entry.open += 1;
    entry.reopened += item.reopenCount;
    if (item.createdAt > entry.lastAt) entry.lastAt = item.createdAt;
    recurringMap.set(key, entry);
  }
  const recurring = [...recurringMap.values()]
    .filter((entry) => entry.count >= 2 || entry.reopened > 0)
    .sort((a, b) => b.count + b.reopened - (a.count + a.reopened))
    .slice(0, 8)
    .map((entry) => ({
      location: getLocation(entry.locationId)?.shortName ?? entry.locationId,
      category: categoryLabel(entry.category),
      count: entry.count,
      open: entry.open,
      reopened: entry.reopened,
      lastAt: entry.lastAt.toISOString(),
    }));

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);
  const weeks: string[] = [];
  for (let index = 7; index >= 0; index -= 1) weeks.push(weekStart(new Date(now - index * 7 * 24 * HOUR)));
  const trend = weeks.map((week) => {
    const row: Record<string, string | number> = { week: week.slice(5) };
    for (const category of topCategories) {
      row[categoryLabel(category)] = complaints.filter(
        (item) => item.category === category && weekStart(item.createdAt) === week,
      ).length;
    }
    return row;
  });

  const rated = complaints.filter((item) => typeof item.rating === "number");
  const feedback = {
    average: average(rated.map((item) => item.rating!)),
    count: rated.length,
    responseRate: percent(rated.length, complaints.filter((item) => item.status === "CLOSED").length),
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rated.filter((item) => item.rating === stars).length })),
    recent: rated
      .filter((item) => item.ratingComment)
      .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0))
      .slice(0, 4)
      .map((item) => ({ ticketNo: item.ticketNo, rating: item.rating!, comment: item.ratingComment!, category: categoryLabel(item.category) })),
  };

  const technicians = await prisma.user.findMany({
    where: { active: true, role: { in: roleValues("TECHNICIAN") } },
    select: { id: true, name: true, department: true },
  });
  const ownDepartment = opsDepartmentOf(user.department);
  const workload = technicians
    .filter((person) => can(user, "analytics:view") || opsDepartmentOf(person.department) === ownDepartment)
    .map((person) => {
      const mine = complaints.filter((item) => item.assigneeId === person.id);
      const openMine = mine.filter((item) => !isDone(item.status));
      const done = mine.filter((item) => item.resolvedAt);
      return {
        id: person.id,
        name: person.name,
        department: person.department,
        assigned: openMine.length,
        inProgress: mine.filter((item) => item.status === "IN_PROGRESS").length,
        resolved: mine.filter((item) => isDone(item.status)).length,
        overdue: openMine.filter((item) => item.dueAt.getTime() < now).length,
        avgHours: average(done.map(resolutionHours).filter((value): value is number => value !== null)),
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
      avgResolution: average(resolvedHours),
      slaCompliance: percent(slaMet.length, resolved.length),
    },
    speed: {
      avgResolutionHours: average(resolvedHours),
      medianResolutionHours: median(resolvedHours),
      avgFirstResponseHours: average(responseHours),
      buckets: speedBuckets,
    },
    departments,
    recurring,
    trend: { categories: topCategories.map(categoryLabel), weeks: trend },
    feedback,
    byCategory,
    byStatus,
    byPriority,
    byDay,
    hotspots: Object.values(byLocation).sort((a, b) => b.open - a.open || b.count - a.count).slice(0, 8),
    workload,
  });
}
