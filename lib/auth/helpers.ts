/**
 * Server-side authentication and authorization helpers.
 *
 * Use these from Server Components, Server Actions, and Route Handlers.
 * They centralize the patterns "who is logged in?" and "is this person
 * allowed to do this?" so individual handlers don't reimplement them.
 */
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./config";
import { prisma } from "@/lib/prisma/base";
import { withMissionScope } from "@/lib/prisma/mission-scope";
import type { UserRole } from "@prisma/client";

/**
 * Returns the current user's session, or null if not signed in.
 * Use this when "logged out" is a valid state for the page.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Returns the current user, or redirects to /login if not signed in.
 * Use this on protected pages.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the current user, or 403s if their role isn't in the allowed list.
 * Use this on pages or actions that require specific roles.
 *
 * Example:
 *   const user = await requireRole(["MAIN_DIRECTOR", "LOCAL_DIRECTOR"]);
 */
export async function requireRole(allowed: UserRole[]) {
  const user = await requireAuth();
  if (!allowed.includes(user.role)) {
    // For server components, throwing here causes Next.js to show
    // the nearest error boundary. In Server Actions, throw a typed error.
    throw new ForbiddenError(
      `Role ${user.role} not permitted; required one of: ${allowed.join(", ")}`,
    );
  }
  return user;
}

/**
 * Returns a Prisma client scoped to the current user's Local Mission.
 *
 * Pattern: in a Server Action or Route Handler, call this BEFORE any
 * DB query. Use the returned client (`db`) instead of the base prisma.
 *
 * Example:
 *   const user = await requireAuth();
 *   const db = await getScopedPrisma();
 *   const apps = await db.application.findMany();  // auto-mission-scoped
 *
 * For SYSTEM_ADMIN and MAIN_DIRECTOR, the returned client is unscoped
 * (they see all missions). For other roles, all queries on mission-
 * scoped models filter by user.homeMissionId.
 */
export async function getScopedPrisma() {
  const user = await requireAuth();
  return withMissionScope(prisma, {
    userId: user.id,
    role: user.role,
    homeMissionId: user.homeMissionId,
  });
}

/**
 * Permission rule: who can create users with which role?
 *
 *  TRAINEE  → anyone (public self-registration)
 *  MAIN_DIRECTOR → SYSTEM_ADMIN only
 *  TRAINER, LOCAL_DIRECTOR → MAIN_DIRECTOR or SYSTEM_ADMIN
 *  SYSTEM_ADMIN → no one (created via seed)
 */
export function canCreateRole(
  actorRole: UserRole | null,
  targetRole: UserRole,
): boolean {
  if (targetRole === "TRAINEE") return true;
  if (targetRole === "SYSTEM_ADMIN") return false;
  if (targetRole === "MAIN_DIRECTOR") return actorRole === "SYSTEM_ADMIN";
  if (targetRole === "TRAINER" || targetRole === "LOCAL_DIRECTOR") {
    return actorRole === "MAIN_DIRECTOR" || actorRole === "SYSTEM_ADMIN";
  }
  return false;
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
}
