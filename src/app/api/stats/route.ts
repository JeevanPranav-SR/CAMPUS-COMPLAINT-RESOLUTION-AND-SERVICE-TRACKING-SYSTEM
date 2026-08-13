import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canSeeAll } from "@/lib/auth";
import { getLocation } from "@/lib/campus";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const where = canSeeAll(user.role) ? {} : { reporterId: user.id };
  const complaints = await prisma.complaint.findMany({
    where,
    include: { reporter: { select: { name: true } }, assignee: { select: { name: true } } },
  });

  const open = complaints.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
  const resolved = complaints.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status));
  const breached = open.filter((item) => new Date(item.dueAt).getTime() < Date.now());
  const critical = open.filter((item) => item.priority === "CRITICAL" || item.priority === "HIGH");

  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byLocation: Record<string, { name: string; count: number; lat: number; lng: number }> = {};

  for (const item of complaints) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    const location = getLocation(item.locationId);
    const key = item.locationId;
    if (!byLocation[key]) {
      byLocation[key] = {
        name: location?.shortName ?? item.locationId,
        count: 0,
        lat: item.lat,
        lng: item.lng,
      };
    }
    byLocation[key].count += 1;
  }

  const resolutionHours = resolved
    .filter((item) => item.resolvedAt)
    .map((item) => (item.resolvedAt!.getTime() - item.createdAt.getTime()) / 3600000);

  const avgResolution =
    resolutionHours.length === 0
      ? 0
      : resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length;

  return NextResponse.json({
    totals: {
      all: complaints.length,
      open: open.length,
      resolved: resolved.length,
      breached: breached.length,
      critical: critical.length,
      avgResolution: Number(avgResolution.toFixed(1)),
    },
    byCategory,
    byStatus,
    hotspots: Object.values(byLocation).sort((a, b) => b.count - a.count).slice(0, 8),
  });
}
