import { prisma } from "./prisma";

export async function allocateTicketNo(year = new Date().getFullYear()) {
  const prefix = `CMP-${year}-`;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const latest = await prisma.complaint.findFirst({
      where: { ticketNo: { startsWith: prefix } },
      orderBy: { ticketNo: "desc" },
      select: { ticketNo: true },
    });
    const current = latest ? Number.parseInt(latest.ticketNo.slice(prefix.length), 10) : 0;
    const next = (Number.isFinite(current) ? current : 0) + 1;
    const ticketNo = `${prefix}${String(next).padStart(5, "0")}`;
    const taken = await prisma.complaint.findUnique({ where: { ticketNo }, select: { id: true } });
    if (!taken) return ticketNo;
  }
  throw new Error("TICKET_ALLOCATION_FAILED");
}
