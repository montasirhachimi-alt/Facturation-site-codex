import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  hicoPilotPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.hicoPilotPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.hicoPilotPrisma = prisma;
}
