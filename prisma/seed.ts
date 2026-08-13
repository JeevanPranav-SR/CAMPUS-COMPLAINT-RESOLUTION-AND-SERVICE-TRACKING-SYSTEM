import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();

  const password = {
    student: await hash("student123"),
    faculty: await hash("faculty123"),
    staff: await hash("staff123"),
    warden: await hash("warden123"),
    admin: await hash("admin123"),
  };

  const admin = await prisma.user.create({
    data: {
      name: "Estate Control Room",
      email: "admin@bitsathy.ac.in",
      passwordHash: password.admin,
      role: "ADMIN",
      department: "Estate Office",
      phone: "04295-226000",
    },
  });

  const ramesh = await prisma.user.create({
    data: {
      name: "Ramesh M",
      email: "ramesh.m@bitsathy.ac.in",
      passwordHash: password.staff,
      role: "STAFF",
      department: "Electrical Maintenance",
      phone: "99429 21201",
    },
  });

  const arun = await prisma.user.create({
    data: {
      name: "Arun P",
      email: "arun.p@bitsathy.ac.in",
      passwordHash: password.staff,
      role: "STAFF",
      department: "Civil & Plumbing",
      phone: "99429 21202",
    },
  });

  const nisha = await prisma.user.create({
    data: {
      name: "Nisha V",
      email: "nisha.v@bitsathy.ac.in",
      passwordHash: password.staff,
      role: "STAFF",
      department: "Data Centre",
      phone: "99429 21203",
    },
  });

  const warden = await prisma.user.create({
    data: {
      name: "Lakshmi Warden",
      email: "lakshmi.w@bitsathy.ac.in",
      passwordHash: password.warden,
      role: "WARDEN",
      department: "Office of the Warden",
      hostel: "Gents Hostels",
      phone: "99429 21210",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya S",
      email: "priya.s@bitsathy.ac.in",
      passwordHash: password.student,
      role: "STUDENT",
      department: "CSE",
      registerNo: "7376221CS201",
      phone: "90000 11101",
    },
  });

  const karthik = await prisma.user.create({
    data: {
      name: "Karthik R",
      email: "karthik.r@bitsathy.ac.in",
      passwordHash: password.student,
      role: "STUDENT",
      department: "IT",
      hostel: "Sapphire",
      registerNo: "7376221IT118",
      phone: "90000 11102",
    },
  });

  const divya = await prisma.user.create({
    data: {
      name: "Divya M",
      email: "divya.m@bitsathy.ac.in",
      passwordHash: password.student,
      role: "STUDENT",
      department: "ECE",
      hostel: "Cauvery",
      registerNo: "7376221EC054",
      phone: "90000 11103",
    },
  });

  const meena = await prisma.user.create({
    data: {
      name: "Dr. Meena K",
      email: "meena.k@bitsathy.ac.in",
      passwordHash: password.faculty,
      role: "FACULTY",
      department: "ECE",
      phone: "99429 21301",
    },
  });

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);
  const hoursFrom = (h: number) => new Date(Date.now() + h * 3600000);

  const tickets = [
    {
      ticketNo: "BIT-26-00012",
      title: "Corridor lights out in Sun Flower Block, 2nd floor",
      description:
        "The entire east corridor of Sun Flower Block (School of Computing) is dark after 6 PM. Students leaving late labs have no lighting near the staircase.",
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
      createdAt: hoursAgo(10),
      dueAt: hoursFrom(-2),
      events: [
        { status: "SUBMITTED", note: "Ticket raised from student portal.", at: 10, actorId: priya.id },
        { status: "ACKNOWLEDGED", note: "Estate control room acknowledged.", at: 9.5, actorId: admin.id },
        { status: "ASSIGNED", note: "Assigned to Electrical Maintenance — Ramesh M.", at: 9, actorId: admin.id },
        { status: "IN_PROGRESS", note: "Fault isolated to MCB in panel SF-2E. Spare breaker indented.", at: 3, actorId: ramesh.id },
      ],
    },
    {
      ticketNo: "BIT-26-00018",
      title: "Wi-Fi down in Learning Centre reading hall",
      description:
        "BIT-Student SSID is not visible on floors 3 and 4 of the Learning Centre. Digital library systems on floor 4 cannot reach e-journals.",
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
      createdAt: hoursAgo(3),
      dueAt: hoursFrom(-1),
      events: [
        { status: "SUBMITTED", note: "Faculty reported access outage during journal hour.", at: 3, actorId: meena.id },
        { status: "ACKNOWLEDGED", note: "Data Centre desk acknowledged.", at: 2.7, actorId: admin.id },
        { status: "ASSIGNED", note: "Assigned to Nisha V — access point audit.", at: 2.4, actorId: admin.id },
      ],
    },
    {
      ticketNo: "BIT-26-00021",
      title: "Water leakage in Sapphire hostel washroom",
      description:
        "Continuous drip from the overhead line in Sapphire Gents Hostel, ground-floor washroom. Floor is wet and slippery.",
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
      createdAt: hoursAgo(5),
      dueAt: hoursFrom(3),
      events: [
        { status: "SUBMITTED", note: "Hostel resident report.", at: 5, actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Warden desk forwarded to Civil & Plumbing.", at: 4.5, actorId: warden.id },
      ],
    },
    {
      ticketNo: "BIT-26-00024",
      title: "Broken projector in ECE seminar hall",
      description:
        "The ceiling projector in ECE seminar hall does not power on. HDMI switch is fine; lamp indicator stays off.",
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
      createdAt: hoursAgo(2),
      dueAt: hoursFrom(22),
      events: [{ status: "SUBMITTED", note: "Logged before afternoon lecture.", at: 2, actorId: meena.id }],
    },
    {
      ticketNo: "BIT-26-00027",
      title: "Mess token kiosk frozen at Gents Mess",
      description:
        "The RFID token kiosk at Gents Hostel Mess is frozen on the previous meal. Queue overflow during lunch.",
      category: "MESS",
      priority: "HIGH",
      status: "IN_PROGRESS",
      locationId: "gents-mess",
      lat: 11.49945,
      lng: 77.27625,
      landmark: "Entry kiosk",
      reporterId: karthik.id,
      assigneeId: nisha.id,
      slaHours: 8,
      createdAt: hoursAgo(7),
      dueAt: hoursFrom(1),
      events: [
        { status: "SUBMITTED", note: "Reported during lunch rush.", at: 7, actorId: karthik.id },
        { status: "ASSIGNED", note: "Data Centre taking kiosk remotely.", at: 6.5, actorId: admin.id },
        { status: "IN_PROGRESS", note: "Rebooted; waiting on POS service pack.", at: 2, actorId: nisha.id },
      ],
    },
    {
      ticketNo: "BIT-26-00031",
      title: "AC not cooling in Principal Office waiting lounge",
      description:
        "Cassette AC in the waiting lounge outside Principal Office blows warm air. Visitors waiting for more than 20 minutes.",
      category: "CIVIL",
      priority: "MEDIUM",
      status: "ASSIGNED",
      locationId: "principal",
      lat: 11.4976902,
      lng: 77.2786262,
      landmark: "Waiting lounge",
      reporterId: meena.id,
      assigneeId: arun.id,
      slaHours: 72,
      createdAt: hoursAgo(20),
      dueAt: hoursFrom(52),
      events: [
        { status: "SUBMITTED", note: "Front-office observation.", at: 20, actorId: meena.id },
        { status: "ASSIGNED", note: "Linked to chiller circuit C-2.", at: 18, actorId: admin.id },
      ],
    },
    {
      ticketNo: "BIT-26-00033",
      title: "Street light dark near Main Gate pedestrian path",
      description:
        "The pedestrian path from SH-82 Main Gate to BIT Main Buildings has two poles out. Night entry is poorly lit.",
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
      createdAt: hoursAgo(36),
      dueAt: hoursAgo(28),
      resolvedAt: hoursAgo(30),
      events: [
        { status: "SUBMITTED", note: "Day-scholar evening report.", at: 36, actorId: priya.id },
        { status: "ASSIGNED", note: "Electrical night crew.", at: 34, actorId: admin.id },
        { status: "IN_PROGRESS", note: "Replaced sodium fittings with LED.", at: 32, actorId: ramesh.id },
        { status: "RESOLVED", note: "Both poles restored. Awaiting student close.", at: 30, actorId: ramesh.id },
      ],
    },
    {
      ticketNo: "BIT-26-00036",
      title: "Cauvery hostel geyser not heating",
      description:
        "Geyser in Cauvery Ladies Hostel, first-floor common bath, stays cold. Morning queue is spilling into the corridor.",
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
      createdAt: hoursAgo(8),
      dueAt: hoursFrom(0.5),
      events: [
        { status: "SUBMITTED", note: "Ladies hostel resident report.", at: 8, actorId: divya.id },
        { status: "ACKNOWLEDGED", note: "Warden notified plumbing.", at: 7.5, actorId: warden.id },
        { status: "IN_PROGRESS", note: "Thermostat failed; replacement in transit from stores.", at: 2, actorId: arun.id },
      ],
    },
    {
      ticketNo: "BIT-26-00040",
      title: "RO water taste issue at Mechanical Block cooler",
      description:
        "Drinking water from the Mechanical Block cooler has a strong chlorine smell since morning.",
      category: "PLUMBING",
      priority: "MEDIUM",
      status: "SUBMITTED",
      locationId: "mechanical",
      lat: 11.49372,
      lng: 77.27785,
      landmark: "Ground floor cooler",
      reporterId: priya.id,
      assigneeId: null,
      slaHours: 24,
      createdAt: hoursAgo(1),
      dueAt: hoursFrom(23),
      events: [{ status: "SUBMITTED", note: "Logged after lab hours.", at: 1, actorId: priya.id }],
    },
    {
      ticketNo: "BIT-26-00042",
      title: "Basketball court floodlight flicker",
      description:
        "North floodlight bank at the sports complex flickers and trips after 15 minutes. Evening practice affected.",
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
      createdAt: hoursAgo(14),
      dueAt: hoursFrom(58),
      events: [
        { status: "SUBMITTED", note: "Sports committee report.", at: 14, actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Logged against electrical night shift.", at: 13, actorId: admin.id },
      ],
    },
    {
      ticketNo: "BIT-26-00045",
      title: "Medical Centre pharmacy printer offline",
      description:
        "Prescription printer at the Medical Centre is offline. Nurses are writing slips by hand.",
      category: "MEDICAL",
      priority: "HIGH",
      status: "RESOLVED",
      locationId: "medical",
      lat: 11.49815,
      lng: 77.27655,
      landmark: "Pharmacy counter",
      reporterId: divya.id,
      assigneeId: nisha.id,
      slaHours: 2,
      createdAt: hoursAgo(26),
      dueAt: hoursAgo(24),
      resolvedAt: hoursAgo(25),
      events: [
        { status: "SUBMITTED", note: "Nurse station request via student volunteer.", at: 26, actorId: divya.id },
        { status: "IN_PROGRESS", note: "USB stack reset and driver reinstall.", at: 25.4, actorId: nisha.id },
        { status: "RESOLVED", note: "Printer online. Closed by technician.", at: 25, actorId: nisha.id },
      ],
    },
    {
      ticketNo: "BIT-26-00048",
      title: "Broken paving near Co-operative Store",
      description:
        "Uneven paver blocks outside the co-operative store. Two students tripped this week.",
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
      createdAt: hoursAgo(16),
      dueAt: hoursFrom(8),
      events: [
        { status: "SUBMITTED", note: "Safety concern.", at: 16, actorId: priya.id },
        { status: "ASSIGNED", note: "Civil team to recast 12 tiles.", at: 12, actorId: admin.id },
      ],
    },
    {
      ticketNo: "BIT-26-00051",
      title: "Bus 12 late departure display stuck",
      description:
        "Transport yard LED board still shows yesterday's 16:40 for Bus 12 (Sathy route). Students missed the slot.",
      category: "TRANSPORT",
      priority: "MEDIUM",
      status: "SUBMITTED",
      locationId: "transport",
      lat: 11.49075,
      lng: 77.27455,
      landmark: "LED departure board",
      reporterId: priya.id,
      assigneeId: null,
      slaHours: 24,
      createdAt: hoursAgo(4),
      dueAt: hoursFrom(20),
      events: [{ status: "SUBMITTED", note: "Day-scholar report.", at: 4, actorId: priya.id }],
    },
    {
      ticketNo: "BIT-26-00054",
      title: "Housekeeping request — Vedanayagam foyer",
      description:
        "Foyer of Vedanayagam Auditorium has leftover event debris from last night's club inauguration.",
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
      createdAt: hoursAgo(40),
      dueAt: hoursAgo(-8),
      resolvedAt: hoursAgo(32),
      events: [
        { status: "SUBMITTED", note: "After-event cleanup.", at: 40, actorId: meena.id },
        { status: "IN_PROGRESS", note: "Housekeeping crew on site.", at: 36, actorId: arun.id },
        { status: "RESOLVED", note: "Foyer cleared.", at: 32, actorId: arun.id },
        { status: "CLOSED", note: "Verified by faculty.", at: 30, actorId: meena.id },
      ],
    },
    {
      ticketNo: "BIT-26-00058",
      title: "ATM vestibule door jammed (KVB)",
      description:
        "KVB ATM glass door at the ATM cluster does not latch. Door swings in the wind.",
      category: "SECURITY",
      priority: "MEDIUM",
      status: "ACKNOWLEDGED",
      locationId: "atm",
      lat: 11.4947,
      lng: 77.27545,
      landmark: "KVB vestibule",
      reporterId: karthik.id,
      assigneeId: null,
      slaHours: 12,
      createdAt: hoursAgo(6),
      dueAt: hoursFrom(6),
      events: [
        { status: "SUBMITTED", note: "Noticed after dinner.", at: 6, actorId: karthik.id },
        { status: "ACKNOWLEDGED", note: "Security informed bank vendor.", at: 5.5, actorId: admin.id },
      ],
    },
  ];

  for (const ticket of tickets) {
    const { events, ...data } = ticket;
    const complaint = await prisma.complaint.create({
      data: {
        ...data,
        updatedAt: data.createdAt,
      },
    });
    for (const event of events) {
      await prisma.timelineEvent.create({
        data: {
          complaintId: complaint.id,
          actorId: event.actorId,
          status: event.status,
          note: event.note,
          createdAt: hoursAgo(event.at),
        },
      });
    }
  }

  console.log("Seeded BIT campus users and service tickets.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
