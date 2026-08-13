import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ago = (h: number) => new Date(Date.now() - h * 3600000);
const ahead = (h: number) => new Date(Date.now() + h * 3600000);

async function main() {
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();

  const password = {
    student: await bcrypt.hash("student123", 10),
    faculty: await bcrypt.hash("faculty123", 10),
    staff: await bcrypt.hash("staff123", 10),
    warden: await bcrypt.hash("warden123", 10),
    admin: await bcrypt.hash("admin123", 10),
  };

  const admin = await prisma.user.create({
    data: { name: "Kavitha Estate", email: "admin@bitsathy.ac.in", passwordHash: password.admin, role: "ADMIN", department: "Estate Office", phone: "04295-226000" },
  });
  const ramesh = await prisma.user.create({
    data: { name: "Ramesh M", email: "ramesh.m@bitsathy.ac.in", passwordHash: password.staff, role: "STAFF", department: "Electrical Maintenance", phone: "99429 21201" },
  });
  const arun = await prisma.user.create({
    data: { name: "Arun P", email: "arun.p@bitsathy.ac.in", passwordHash: password.staff, role: "STAFF", department: "Civil & Plumbing", phone: "99429 21202" },
  });
  const nisha = await prisma.user.create({
    data: { name: "Nisha V", email: "nisha.v@bitsathy.ac.in", passwordHash: password.staff, role: "STAFF", department: "Data Centre", phone: "99429 21203" },
  });
  const warden = await prisma.user.create({
    data: { name: "Lakshmi Warden", email: "lakshmi.w@bitsathy.ac.in", passwordHash: password.warden, role: "WARDEN", department: "Office of the Warden", hostel: "Gents Hostels", phone: "99429 21210" },
  });
  const priya = await prisma.user.create({
    data: { name: "Priya S", email: "priya.s@bitsathy.in", passwordHash: password.student, role: "STUDENT", department: "CSE", registerNo: "7376221CS201" },
  });
  const karthik = await prisma.user.create({
    data: { name: "Karthik R", email: "karthik.r@bitsathy.in", passwordHash: password.student, role: "STUDENT", department: "IT", hostel: "Sapphire", registerNo: "7376221IT118" },
  });
  const divya = await prisma.user.create({
    data: { name: "Divya M", email: "divya.m@bitsathy.in", passwordHash: password.student, role: "STUDENT", department: "ECE", hostel: "Cauvery", registerNo: "7376221EC054" },
  });
  const meena = await prisma.user.create({
    data: { name: "Dr. Meena K", email: "meena.k@bitsathy.ac.in", passwordHash: password.faculty, role: "FACULTY", department: "ECE" },
  });

  type SeedTicket = {
    ticketNo: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    locationId: string;
    lat: number;
    lng: number;
    landmark: string;
    reporterId: string;
    assigneeId: string | null;
    slaHours: number;
    createdAt: Date;
    dueAt: Date;
    acknowledgedAt?: Date | null;
    assignedAt?: Date | null;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
    rating?: number | null;
    events: { status: string; note: string; at: Date; actorId: string }[];
    comments?: { body: string; at: Date; actorId: string }[];
  };

  const tickets: SeedTicket[] = [
    {
      ticketNo: "CMP-2026-00012",
      title: "Corridor lights out in Sun Flower Block, 2nd floor",
      description: "The east corridor of Sun Flower Block is dark after 6 PM. Students leaving late labs have no lighting near the staircase.",
      category: "ELECTRICAL",
      priority: "HIGH",
      status: "IN_PROGRESS",
      locationId: "sunflower",
      lat: 11.4963607,
      lng: 77.2786254,
      landmark: "2nd floor east corridor",
      reporterId: priya.id,
      assigneeId: ramesh.id,
      slaHours: 8,
      createdAt: ago(10),
      dueAt: ahead(-2),
      acknowledgedAt: ago(9.5),
      assignedAt: ago(9),
      events: [
        { status: "SUBMITTED", note: "Filed from student portal.", at: ago(10), actorId: priya.id },
        { status: "ACKNOWLEDGED", note: "Estate office acknowledged the outage.", at: ago(9.5), actorId: admin.id },
        { status: "ASSIGNED", note: "Assigned to Ramesh M, Electrical Maintenance.", at: ago(9), actorId: admin.id },
        { status: "IN_PROGRESS", note: "Fault isolated to MCB in panel SF-2E.", at: ago(3), actorId: ramesh.id },
      ],
      comments: [{ body: "Please restore before evening lab hours.", at: ago(8), actorId: priya.id }],
    },
    {
      ticketNo: "CMP-2026-00018",
      title: "Wi-Fi down in Learning Centre reading hall",
      description: "BIT-Student SSID is not visible on floors 3 and 4. Digital library systems cannot reach e-journals.",
      category: "IT_WIFI",
      priority: "CRITICAL",
      status: "ASSIGNED",
      locationId: "learning-centre",
      lat: 11.49605,
      lng: 77.27755,
      landmark: "4th floor digital library",
      reporterId: meena.id,
      assigneeId: nisha.id,
      slaHours: 2,
      createdAt: ago(3),
      dueAt: ahead(-1),
      acknowledgedAt: ago(2.7),
      assignedAt: ago(2.4),
      events: [
        { status: "SUBMITTED", note: "Faculty reported access outage during journal hour.", at: ago(3), actorId: meena.id },
        { status: "ACKNOWLEDGED", note: "Data Centre desk acknowledged.", at: ago(2.7), actorId: admin.id },
        { status: "ASSIGNED", note: "Assigned to Nisha V for access-point audit.", at: ago(2.4), actorId: admin.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00021",
      title: "Water leakage in Sapphire hostel washroom",
      description: "Continuous drip from the overhead line in Sapphire Gents Hostel, ground-floor washroom. Floor is wet and slippery.",
      category: "PLUMBING",
      priority: "HIGH",
      status: "ACKNOWLEDGED",
      locationId: "sapphire",
      lat: 11.49985,
      lng: 77.27545,
      landmark: "GF washroom, wing B",
      reporterId: karthik.id,
      assigneeId: arun.id,
      slaHours: 8,
      createdAt: ago(5),
      dueAt: ahead(3),
      acknowledgedAt: ago(4.5),
      events: [
        { status: "SUBMITTED", note: "Hostel resident report.", at: ago(5), actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Warden forwarded to Civil & Plumbing.", at: ago(4.5), actorId: warden.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00024",
      title: "Broken classroom projector in ECE seminar hall",
      description: "Ceiling projector does not power on. HDMI path is fine; lamp indicator stays off.",
      category: "ACADEMIC",
      priority: "MEDIUM",
      status: "SUBMITTED",
      locationId: "ece-block",
      lat: 11.49515,
      lng: 77.27835,
      landmark: "Seminar hall, 1st floor",
      reporterId: meena.id,
      assigneeId: null,
      slaHours: 24,
      createdAt: ago(2),
      dueAt: ahead(22),
      events: [{ status: "SUBMITTED", note: "Logged before afternoon lecture.", at: ago(2), actorId: meena.id }],
    },
    {
      ticketNo: "CMP-2026-00033",
      title: "Street light not functioning near Main Gate",
      description: "Pedestrian path from SH-82 Main Gate to BIT Main Buildings has two poles out.",
      category: "ELECTRICAL",
      priority: "HIGH",
      status: "RESOLVED",
      locationId: "main-gate",
      lat: 11.4953539,
      lng: 77.2738945,
      landmark: "Path to main block",
      reporterId: priya.id,
      assigneeId: ramesh.id,
      slaHours: 8,
      createdAt: ago(36),
      dueAt: ago(28),
      acknowledgedAt: ago(35),
      assignedAt: ago(34),
      resolvedAt: ago(30),
      events: [
        { status: "SUBMITTED", note: "Day-scholar evening report.", at: ago(36), actorId: priya.id },
        { status: "ASSIGNED", note: "Electrical night crew assigned.", at: ago(34), actorId: admin.id },
        { status: "IN_PROGRESS", note: "Replaced fittings with LED.", at: ago(32), actorId: ramesh.id },
        { status: "RESOLVED", note: "Both poles restored. Awaiting student verification.", at: ago(30), actorId: ramesh.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00036",
      title: "Washroom geyser not heating in Cauvery hostel",
      description: "Geyser in Cauvery Ladies Hostel, first-floor common bath, stays cold.",
      category: "HOSTEL",
      priority: "HIGH",
      status: "IN_PROGRESS",
      locationId: "cauvery",
      lat: 11.49885,
      lng: 77.27925,
      landmark: "1st floor common bath",
      reporterId: divya.id,
      assigneeId: arun.id,
      slaHours: 8,
      createdAt: ago(8),
      dueAt: ahead(0.5),
      acknowledgedAt: ago(7.5),
      assignedAt: ago(7),
      events: [
        { status: "SUBMITTED", note: "Ladies hostel resident report.", at: ago(8), actorId: divya.id },
        { status: "ASSIGNED", note: "Plumbing team assigned.", at: ago(7), actorId: warden.id },
        { status: "IN_PROGRESS", note: "Thermostat failed; replacement in transit.", at: ago(2), actorId: arun.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00040",
      title: "Drinking water taste issue at Mechanical Block cooler",
      description: "Water from the Mechanical Block cooler has a strong chlorine smell since morning.",
      category: "WATER",
      priority: "MEDIUM",
      status: "SUBMITTED",
      locationId: "mechanical",
      lat: 11.49372,
      lng: 77.27785,
      landmark: "Ground floor cooler",
      reporterId: priya.id,
      assigneeId: null,
      slaHours: 24,
      createdAt: ago(1),
      dueAt: ahead(23),
      events: [{ status: "SUBMITTED", note: "Logged after lab hours.", at: ago(1), actorId: priya.id }],
    },
    {
      ticketNo: "CMP-2026-00045",
      title: "Damaged desk in Learning Centre reading hall",
      description: "Two reading desks on floor 2 have broken laminates and exposed screws.",
      category: "FURNITURE",
      priority: "LOW",
      status: "CLOSED",
      locationId: "learning-centre",
      lat: 11.49605,
      lng: 77.27755,
      landmark: "Floor 2, row C",
      reporterId: karthik.id,
      assigneeId: arun.id,
      slaHours: 120,
      createdAt: ago(90),
      dueAt: ago(-30),
      acknowledgedAt: ago(88),
      assignedAt: ago(80),
      resolvedAt: ago(70),
      closedAt: ago(68),
      rating: 5,
      events: [
        { status: "SUBMITTED", note: "Reported damaged furniture.", at: ago(90), actorId: karthik.id },
        { status: "RESOLVED", note: "Desks replaced from stores.", at: ago(70), actorId: arun.id },
        { status: "CLOSED", note: "Verified by student. Rating 5/5.", at: ago(68), actorId: karthik.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00048",
      title: "Broken paving near Co-operative Store",
      description: "Uneven paver blocks outside the co-operative store. Two students tripped this week.",
      category: "CIVIL",
      priority: "HIGH",
      status: "ASSIGNED",
      locationId: "coop-store",
      lat: 11.49495,
      lng: 77.27575,
      landmark: "Storefront walkway",
      reporterId: priya.id,
      assigneeId: arun.id,
      slaHours: 24,
      createdAt: ago(16),
      dueAt: ahead(8),
      assignedAt: ago(12),
      events: [
        { status: "SUBMITTED", note: "Safety concern.", at: ago(16), actorId: priya.id },
        { status: "ASSIGNED", note: "Civil team to recast 12 tiles.", at: ago(12), actorId: admin.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00051",
      title: "AC not functioning in Vedanayagam foyer",
      description: "Cassette AC blows warm air in the auditorium foyer.",
      category: "CIVIL",
      priority: "MEDIUM",
      status: "REOPENED",
      locationId: "vedanayagam",
      lat: 11.49575,
      lng: 77.27755,
      landmark: "Foyer",
      reporterId: meena.id,
      assigneeId: arun.id,
      slaHours: 72,
      createdAt: ago(40),
      dueAt: ahead(32),
      assignedAt: ago(36),
      resolvedAt: null,
      events: [
        { status: "SUBMITTED", note: "Foyer is uncomfortable during events.", at: ago(40), actorId: meena.id },
        { status: "RESOLVED", note: "Filter cleaned.", at: ago(20), actorId: arun.id },
        { status: "REOPENED", note: "Still blowing warm air during rehearsal.", at: ago(6), actorId: meena.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00054",
      title: "Housekeeping required in Vedanayagam foyer",
      description: "Leftover event debris from last night's club inauguration.",
      category: "HOUSEKEEPING",
      priority: "LOW",
      status: "CLOSED",
      locationId: "vedanayagam",
      lat: 11.49575,
      lng: 77.27755,
      landmark: "Foyer",
      reporterId: meena.id,
      assigneeId: arun.id,
      slaHours: 48,
      createdAt: ago(40),
      dueAt: ago(-8),
      resolvedAt: ago(32),
      closedAt: ago(30),
      rating: 4,
      events: [
        { status: "SUBMITTED", note: "After-event cleanup.", at: ago(40), actorId: meena.id },
        { status: "RESOLVED", note: "Foyer cleared.", at: ago(32), actorId: arun.id },
        { status: "CLOSED", note: "Verified by faculty.", at: ago(30), actorId: meena.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00058",
      title: "Basketball court floodlight flicker",
      description: "North floodlight bank at the sports complex flickers and trips after 15 minutes.",
      category: "SPORTS",
      priority: "MEDIUM",
      status: "ACKNOWLEDGED",
      locationId: "sports-complex",
      lat: 11.49285,
      lng: 77.27985,
      landmark: "North floodlight bank",
      reporterId: karthik.id,
      assigneeId: ramesh.id,
      slaHours: 72,
      createdAt: ago(14),
      dueAt: ahead(58),
      acknowledgedAt: ago(13),
      events: [
        { status: "SUBMITTED", note: "Sports committee report.", at: ago(14), actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Logged against electrical night shift.", at: ago(13), actorId: admin.id },
      ],
    },
    {
      ticketNo: "CMP-2026-00061",
      title: "College bus delay at Sathy bus stand pickup",
      description: "BIT Bus Route 4 arrived 25 minutes late for the 4:40 PM pickup. Day scholars missed the first evening slot.",
      category: "TRANSPORT",
      priority: "MEDIUM",
      status: "SUBMITTED",
      locationId: "transport",
      lat: 11.49315,
      lng: 77.27585,
      landmark: "Route 4 evening pickup",
      reporterId: priya.id,
      assigneeId: null,
      slaHours: 12,
      createdAt: ago(4),
      dueAt: ahead(8),
      events: [{ status: "SUBMITTED", note: "Reported by day scholars after the delay.", at: ago(4), actorId: priya.id }],
    },
    {
      ticketNo: "CMP-2026-00066",
      title: "Broken street-side turnstile near Learning Centre",
      description: "The pedestrian gate latch near Learning Centre does not lock after 9 PM. Security requested an estate fix.",
      category: "SECURITY",
      priority: "HIGH",
      status: "ASSIGNED",
      locationId: "learning-centre",
      lat: 11.49612,
      lng: 77.2772,
      landmark: "West pedestrian gate",
      reporterId: karthik.id,
      assigneeId: arun.id,
      slaHours: 4,
      createdAt: ago(6),
      dueAt: ahead(-1),
      acknowledgedAt: ago(5.5),
      assignedAt: ago(5),
      events: [
        { status: "SUBMITTED", note: "Night security log forwarded by student.", at: ago(6), actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Estate desk acknowledged the latch failure.", at: ago(5.5), actorId: admin.id },
        { status: "ASSIGNED", note: "Assigned to Arun P for mechanical repair.", at: ago(5), actorId: admin.id },
      ],
    },
  ];

  const createdIds = new Map<string, string>();
  for (const ticket of tickets) {
    const { events, comments, ...data } = ticket;
    const complaint = await prisma.complaint.create({
      data: { ...data, reopenCount: ticket.status === "REOPENED" ? 1 : 0, updatedAt: data.createdAt },
    });
    createdIds.set(ticket.ticketNo, complaint.id);
    for (const event of events) {
      await prisma.timelineEvent.create({
        data: { complaintId: complaint.id, actorId: event.actorId, status: event.status, action: "STATUS", note: event.note, createdAt: event.at },
      });
    }
    for (const comment of comments ?? []) {
      await prisma.comment.create({
        data: { complaintId: complaint.id, actorId: comment.actorId, body: comment.body, createdAt: comment.at },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      { userId: priya.id, complaintId: createdIds.get("CMP-2026-00012"), title: "Complaint assigned", body: "CMP-2026-00012 has been assigned to Ramesh M." },
      { userId: priya.id, complaintId: createdIds.get("CMP-2026-00033"), title: "Awaiting verification", body: "CMP-2026-00033 has been marked resolved. Please verify." },
      { userId: priya.id, complaintId: createdIds.get("CMP-2026-00012"), title: "SLA exceeded", body: "CMP-2026-00012 has exceeded its SLA window." },
      { userId: admin.id, complaintId: createdIds.get("CMP-2026-00040"), title: "New complaint submitted", body: "CMP-2026-00040: Drinking water taste issue at Mechanical Block cooler" },
      { userId: arun.id, complaintId: createdIds.get("CMP-2026-00051"), title: "Ticket reopened", body: "CMP-2026-00051 was reopened and needs attention." },
      { userId: ramesh.id, complaintId: createdIds.get("CMP-2026-00012"), title: "SLA exceeded", body: "CMP-2026-00012 has exceeded its SLA. Corridor lights are still open." },
      { userId: nisha.id, complaintId: createdIds.get("CMP-2026-00018"), title: "SLA exceeded", body: "CMP-2026-00018 has exceeded its SLA. Wi-Fi in Learning Centre is still down." },
    ],
  });

  console.log("Seeded campus operations data.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
