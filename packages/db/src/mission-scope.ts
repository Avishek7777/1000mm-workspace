/**
 * Prisma Client Extension: Local Mission scope enforcement
 *
 * Automatically restricts queries on mission-scoped models to rows
 * belonging to the current user's Local Mission, UNLESS the user's
 * role grants cross-mission visibility (MAIN_DIRECTOR, SYSTEM_ADMIN).
 *
 * USAGE
 * ─────
 * 1. Build a per-request Prisma client using the user's auth context:
 *
 *    import { prisma } from "@1000mm/db";
 *    import { withMissionScope } from "@1000mm/db";
 *
 *    const scoped = withMissionScope(prisma, {
 *      userId: session.user.id,
 *      role: session.user.role,
 *      homeMissionId: session.user.homeMissionId,
 *    });
 *
 *    // Now queries are automatically scoped:
 *    const apps = await scoped.application.findMany();
 *    // ↑ only returns applications where submittedFromMissionId === user's mission
 *    //   (unless user is MAIN_DIRECTOR or SYSTEM_ADMIN, who see all)
 *
 * 2. NEVER use the unscoped `prisma` client directly in request handlers.
 *    Reserve it for the auth/login flow, the seed script, and background
 *    jobs that have already-validated context.
 *
 * WHAT THIS ENFORCES
 * ──────────────────
 *  • findMany / findFirst / findUnique → filtered by mission
 *  • update / delete / count → filtered by mission
 *  • create → REJECTED if attempting to create a row in another mission
 *
 * WHAT THIS DOES NOT ENFORCE
 * ──────────────────────────
 *  • Field-level permissions (e.g., hiding NID from view)
 *  • Workflow state-machine rules (e.g., who can transition what)
 *  • Aggregations that bypass Prisma (e.g., $queryRaw)
 *  → Those checks live in the service layer and route handlers.
 *
 * TESTING
 * ───────
 * See tests/mission-scope.test.ts. Key invariant under test:
 *  "LMD A cannot see, update, or delete LMD B's applications via this extension"
 */

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type AuthContext = {
  userId: string;
  role:
    | "TRAINEE"
    | "TRAINER"
    | "LOCAL_DIRECTOR"
    | "MAIN_DIRECTOR"
    | "SYSTEM_ADMIN";
  homeMissionId: string;
};

/**
 * Models that hold mission-scoped data.
 *
 * Each entry maps a Prisma model name to the column on that model
 * that holds the owning mission's id. For models reached through a
 * relation (where the column itself isn't on the model), we use a
 * relation filter — see the SCOPED_RELATIONS map below.
 */
const SCOPED_BY_COLUMN: Record<string, string> = {
  application: "submittedFromMissionId",
  applicationWindow: "scopedToMissionId", // nullable: null windows are global
};

/**
 * Models reached through a relation chain to mission ownership.
 *
 * Example: ApplicationDocument has no mission column of its own,
 * but it belongs to an Application which does. We filter via the
 * relation.
 */
const SCOPED_RELATIONS: Record<string, { relation: string; column: string }> = {
  applicationDocument: {
    relation: "application",
    column: "submittedFromMissionId",
  },
  recommendation: { relation: "application", column: "submittedFromMissionId" },
  applicationStatusHistory: {
    relation: "application",
    column: "submittedFromMissionId",
  },
  programEnrollment: { relation: "trainee", column: "homeMissionId" },
};

/**
 * Roles that bypass mission scoping (can see across all missions).
 */
const CROSS_MISSION_ROLES = new Set(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

/**
 * Wraps a PrismaClient with a mission-scope extension.
 */
export function withMissionScope(prisma: PrismaClient, ctx: AuthContext) {
  // Cross-mission roles get an unmodified client.
  if (CROSS_MISSION_ROLES.has(ctx.role)) return prisma;

  return prisma.$extends({
    name: "missionScope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model) return query(args);

          // Convert "Application" → "application" to look up our maps
          const modelKey = model.charAt(0).toLowerCase() + model.slice(1);

          const directCol = SCOPED_BY_COLUMN[modelKey];
          const relScope = SCOPED_RELATIONS[modelKey];

          // Not scoped → pass through
          if (!directCol && !relScope) return query(args);

          // Build the mission filter
          const missionFilter = directCol
            ? {
                OR: [
                  { [directCol]: ctx.homeMissionId },
                  // Allow null for nullable mission columns (e.g., global windows)
                  ...(directCol === "scopedToMissionId"
                    ? [{ [directCol]: null }]
                    : []),
                ],
              }
            : {
                [relScope!.relation]: {
                  [relScope!.column]: ctx.homeMissionId,
                },
              };

          switch (operation) {
            case "findUnique":
            case "findFirst":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
            case "updateMany":
            case "deleteMany": {
              (args as Record<string, unknown>).where = args.where
                ? { AND: [args.where, missionFilter] }
                : missionFilter;
              return query(args);
            }
            case "update":
            case "delete": {
              // For single-row updates/deletes, we first verify the row
              // is in-scope via findFirst, then proceed.
              // Prisma will throw if the row doesn't exist or is out of scope.
              const where = (args as { where: unknown }).where;
              const target = await (prisma as never as Record<string, never>)[
                modelKey
              ].findFirst({
                where: { AND: [where, missionFilter] },
                select: { id: true },
              });
              if (!target) {
                throw new MissionScopeViolationError(
                  `Row not found within current mission scope (model=${model}, op=${operation})`,
                );
              }
              return query(args);
            }
            case "create": {
              // Reject creates that explicitly set a different mission
              if (directCol) {
                const data = (args as { data: Record<string, unknown> }).data;
                const proposed = data[directCol];
                if (proposed && proposed !== ctx.homeMissionId) {
                  throw new MissionScopeViolationError(
                    `Cannot create ${model} for another mission (proposed=${proposed as string}, scope=${ctx.homeMissionId})`,
                  );
                }
                if (!proposed) {
                  data[directCol] = ctx.homeMissionId;
                }
              }
              return query(args);
            }
            default:
              return query(args);
          }
        },
      },
    },
  });
}

export class MissionScopeViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionScopeViolationError";
  }
}

// Hint: also export Prisma so callers don't need a separate import
export { Prisma };
