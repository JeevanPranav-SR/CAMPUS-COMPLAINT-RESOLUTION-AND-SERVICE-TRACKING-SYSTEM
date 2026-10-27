import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Idempotent, non-destructive data upgrade. Safe to run repeatedly against
 * production: renames legacy roles/departments, adds the department-head and
 * hostel-technician accounts, and backfills historical tickets used by the
 * recurring-issue and feedback analytics. Existing passwords are never reset.
 */
const ROLE_RENAMES: [string[], string][] = [
  [["STAFF"], "TECHNICIAN"],
  [["WARDEN", "DEPARTMENT_ADMIN"], "DEPARTMENT_HEAD"],
  [["ADMIN"], "SUPER_ADMIN"],
];

const DEPARTMENT_RENAMES: [string, string][] = [
  ["Electrical Maintenance", "Electrical"],
  ["Civil & Plumbing", "Facilities / Civil"],
  ["Data Centre", "IT Infrastructure"],
  ["Office of the Warden", "Hostel Maintenance"],
  ["Estate Office", "Administration"],
];

const NAME_RENAMES: [string, string][] = [
  ["Kavitha Estate", "Kavitha R"],
  ["Lakshmi Warden", "Lakshmi N"],
];

const ago = (hours: number) => new Date(Date.now() - hours * 3600000);

export async function upgrade(prisma: PrismaClient) {
  for (const [from, to] of ROLE_RENAMES) {
    await prisma.user.updateMany({ where: { role: { in: from } }, data: { role: to } });
  }
  for (const [from, to] of DEPARTMENT_RENAMES) {
    await prisma.user.updateMany({ where: { department: from }, data: { department: to } });
  }
  for (const [from, to] of NAME_RENAMES) {
    await prisma.user.updateMany({ where: { name: from }, data: { name: to } });
  }
  await prisma.user.updateMany({
    where: { email: "lakshmi.w@bitsathy.ac.in", department: "Hostel Maintenance" },
    data: { hostel: null },
  });

  const headPassword = await bcrypt.hash("head1234", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);
  const accounts = [
    { name: "Suresh Kumar", email: "head.it@bitsathy.ac.in", role: "DEPARTMENT_HEAD", department: "IT Infrastructure", phone: "99429 21220", passwordHash: headPassword },
    { name: "Prakash V", email: "head.electrical@bitsathy.ac.in", role: "DEPARTMENT_HEAD", department: "Electrical", phone: "99429 21221", passwordHash: headPassword },
    { name: "Revathi S", email: "head.facilities@bitsathy.ac.in", role: "DEPARTMENT_HEAD", department: "Facilities / Civil", phone: "99429 21222", passwordHash: headPassword },
    { name: "Murugan S", email: "murugan.s@bitsathy.ac.in", role: "TECHNICIAN", department: "Hostel Maintenance", phone: "99429 21204", passwordHash: staffPassword },
  ];
  for (const account of accounts) {
    await prisma.user.upsert({ where: { email: account.email }, update: {}, create: account });
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const id = (email: string) => users.find((user) => user.email === email)?.id;
  const arun = id("arun.p@bitsathy.ac.in");
  const murugan = id("murugan.s@bitsathy.ac.in");
  if (arun && murugan) {
    await prisma.complaint.updateMany({
      where: { ticketNo: { in: ["CMP-2026-00021", "CMP-2026-00036"] }, assigneeId: arun },
      data: { assigneeId: murugan },
    });
  }

  await prisma.complaint.updateMany({
    where: { assigneeId: { not: null }, assignee: { role: { notIn: ["TECHNICIAN", "STAFF"] } } },
    data: { assigneeId: null },
  });

  await prisma.complaint.updateMany({
    where: { ticketNo: "CMP-2026-00045", ratingComment: null },
    data: { ratingComment: "Desks were replaced within a day. Thank you." },
  });
  await prisma.complaint.updateMany({
    where: { ticketNo: "CMP-2026-00054", ratingComment: null },
    data: { ratingComment: "Cleaned before the morning event." },
  });

  const priya = id("priya.s@bitsathy.ac.in");
  const meena = id("meena.k@bitsathy.ac.in");
  const karthik = id("karthik.r@bitsathy.ac.in");
  const ramesh = id("ramesh.m@bitsathy.ac.in");
  const nisha = id("nisha.v@bitsathy.ac.in");
  if (!priya || !meena || !karthik || !ramesh || !nisha || !murugan) return;

  const history = [
    {
      ticketNo: "CMP-2026-00003",
      title: "Corridor lights tripping in Sun Flower Block",
      description: "Lights on the 2nd floor east corridor of Sun Flower Block trip every evening around 7 PM.",
      category: "ELECTRICAL", locationId: "sunflower", lat: 11.4963607, lng: 77.2786254, landmark: "2nd floor east corridor",
      reporterId: priya, assigneeId: ramesh, slaHours: 8, openedHoursAgo: 500, resolvedAfter: 6, rating: 4,
      ratingComment: "Fixed the same day, but it tripped again later.",
    },
    {
      ticketNo: "CMP-2026-00005",
      title: "Slow Wi-Fi on Learning Centre 3rd floor",
      description: "BIT-Student Wi-Fi drops every few minutes on the 3rd floor of the Learning Centre during exam prep hours.",
      category: "IT_WIFI", locationId: "learning-centre", lat: 11.49605, lng: 77.27755, landmark: "3rd floor reading hall",
      reporterId: meena, assigneeId: nisha, slaHours: 24, openedHoursAgo: 720, resolvedAfter: 20, rating: 3,
      ratingComment: "Works now, but this keeps happening every few weeks.",
    },
    {
      ticketNo: "CMP-2026-00008",
      title: "Tap leaking in Sapphire hostel washroom",
      description: "The second tap in the Sapphire ground-floor washroom keeps leaking even when fully closed.",
      category: "PLUMBING", locationId: "sapphire", lat: 11.49985, lng: 77.27545, landmark: "GF washroom, wing B",
      reporterId: karthik, assigneeId: murugan, slaHours: 24, openedHoursAgo: 300, resolvedAfter: 10, rating: 4,
      ratingComment: "Quick fix by the hostel team.",
    },
    {
      ticketNo: "CMP-2026-00009",
      title: "Corridor light flicker, Sun Flower 2nd floor",
      description: "Same corridor as last time: the east-wing tube lights flicker and go dark after sunset.",
      category: "ELECTRICAL", locationId: "sunflower", lat: 11.4963607, lng: 77.2786254, landmark: "2nd floor east corridor",
      reporterId: priya, assigneeId: ramesh, slaHours: 8, openedHoursAgo: 160, resolvedAfter: 12, rating: 2,
      ratingComment: "Third time this month. Please replace the panel, not just the fuse.",
    },
  ];

  for (const ticket of history) {
    const exists = await prisma.complaint.findUnique({ where: { ticketNo: ticket.ticketNo }, select: { id: true } });
    if (exists) continue;
    const createdAt = ago(ticket.openedHoursAgo);
    const assignedAt = ago(ticket.openedHoursAgo - 1);
    const resolvedAt = ago(ticket.openedHoursAgo - ticket.resolvedAfter);
    const closedAt = ago(ticket.openedHoursAgo - ticket.resolvedAfter - 4);
    await prisma.complaint.create({
      data: {
        ticketNo: ticket.ticketNo,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: "MEDIUM",
        status: "CLOSED",
        locationId: ticket.locationId,
        lat: ticket.lat,
        lng: ticket.lng,
        landmark: ticket.landmark,
        reporterId: ticket.reporterId,
        assigneeId: ticket.assigneeId,
        slaHours: ticket.slaHours,
        dueAt: new Date(createdAt.getTime() + ticket.slaHours * 3600000),
        createdAt,
        updatedAt: closedAt,
        acknowledgedAt: assignedAt,
        assignedAt,
        resolvedAt,
        closedAt,
        rating: ticket.rating,
        ratingComment: ticket.ratingComment,
        events: {
          create: [
            { status: "SUBMITTED", note: "Filed from the reporter portal.", actorId: ticket.reporterId, createdAt },
            { status: "ASSIGNED", action: "ASSIGN", note: "Assigned to the routed department's technician.", actorId: ticket.assigneeId, createdAt: assignedAt },
            { status: "RESOLVED", note: "Repair completed.", actorId: ticket.assigneeId, createdAt: resolvedAt },
            { status: "CLOSED", action: "VERIFY", note: `Verified by reporter. Rating ${ticket.rating}/5.`, actorId: ticket.reporterId, createdAt: closedAt },
          ],
        },
      },
    });
  }
}

if (process.argv[1]?.endsWith("upgrade.ts")) {
  const prisma = new PrismaClient();
  upgrade(prisma)
    .then(() => console.log("Upgrade complete."))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
