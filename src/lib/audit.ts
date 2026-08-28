import { prisma } from "./prisma";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        detail: input.detail || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
