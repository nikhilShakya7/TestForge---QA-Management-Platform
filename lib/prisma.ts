import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In Next.js development with hot-reloading, importing `new PrismaClient()`
 * at module level can create many client instances and exhaust database
 * connections. We store the client on the global object so it is reused
 * across module reloads while the dev server is running.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
