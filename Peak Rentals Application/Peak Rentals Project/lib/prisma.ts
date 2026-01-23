import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const logLevels =
  process.env.NODE_ENV === "production"
    ? ["error"]
    : ["query", "warn", "error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
