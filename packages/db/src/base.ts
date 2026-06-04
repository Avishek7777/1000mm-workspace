/**
 * Base Prisma Client
 *
 * The unscoped, raw client. Use sparingly:
 *  - During authentication (looking up user by email before we know who they are)
 *  - In the seed script
 *  - In background jobs that have already-validated context
 *
 * For all user-facing request handlers, use getScopedPrisma() instead,
 * which applies mission-scoping based on the current user.
 *
 * Single-instance pattern prevents connection pool exhaustion during
 * Next.js dev mode hot-reload.
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
