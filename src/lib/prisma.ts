import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || /connection_limit=/.test(url)) return url;
  const join = url.includes("?") ? "&" : "?";
  const pooled = /pooler|pgbouncer=true/i.test(url);
  return `${url}${join}connection_limit=5&pool_timeout=15&connect_timeout=10${pooled ? "&pgbouncer=true" : ""}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: datasourceUrl() || undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
