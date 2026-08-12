import { prisma } from "@1000mm/db";

/** A missionary must have served this long before applying. */
export const REQUIRED_SERVICE_MONTHS = 12;

export type Eligibility = {
  eligible: boolean;
  monthsServed: number;
  monthsRemaining: number;
  eligibleFrom: Date | null;
  reason?: string;
};

/**
 * Twelve months of *active* deployment, counted from the earliest deployment
 * that was actually approved. Pending and rejected requests do not count —
 * asking for one does not start the clock.
 *
 * Time is accumulated across deployments rather than taken from the current
 * one alone, so a missionary who was redeployed does not lose credit for the
 * service they already gave.
 */
export async function checkScholarshipEligibility(
  missionaryId: string,
  now: Date = new Date(),
): Promise<Eligibility> {
  const deployments = await prisma.missionaryDeployment.findMany({
    where: {
      missionaryId,
      status: { in: ["ACTIVE", "COMPLETED"] },
      deletedAt: null,
    },
    select: { startDate: true, endDate: true, status: true },
    orderBy: { startDate: "asc" },
  });

  if (deployments.length === 0) {
    return {
      eligible: false,
      monthsServed: 0,
      monthsRemaining: REQUIRED_SERVICE_MONTHS,
      eligibleFrom: null,
      reason:
        "You have no approved deployment yet. Scholarship applications open after twelve months of service.",
    };
  }

  let totalMs = 0;
  for (const d of deployments) {
    const start = new Date(d.startDate);
    // An active deployment counts up to today; a completed one to its end date.
    const end = d.status === "ACTIVE" ? now : new Date(d.endDate ?? now);
    if (end > start) totalMs += end.getTime() - start.getTime();
  }

  const msPerMonth = (365.25 / 12) * 24 * 60 * 60 * 1000;
  const monthsServed = Math.floor(totalMs / msPerMonth);
  const eligible = monthsServed >= REQUIRED_SERVICE_MONTHS;
  const monthsRemaining = Math.max(0, REQUIRED_SERVICE_MONTHS - monthsServed);

  // Projected date the twelfth month completes, assuming service continues.
  const shortfallMs = (REQUIRED_SERVICE_MONTHS - monthsServed) * msPerMonth;
  const eligibleFrom = eligible ? null : new Date(now.getTime() + shortfallMs);

  return {
    eligible,
    monthsServed,
    monthsRemaining,
    eligibleFrom,
    reason: eligible
      ? undefined
      : `Scholarship applications open after ${REQUIRED_SERVICE_MONTHS} months of service. You have ${monthsServed}.`,
  };
}

/** `SCH-EBM-2026-00001`, allocated inside a transaction so two submissions cannot collide. */
export async function generateScholarshipReference(
  missionCode: string,
  year: number,
): Promise<string> {
  const serial = await prisma.$transaction(async (tx) => {
    const counter = await tx.scholarshipCounter.upsert({
      where: { missionCode_year: { missionCode, year } },
      create: { missionCode, year, lastSerial: 1 },
      update: { lastSerial: { increment: 1 } },
    });
    return counter.lastSerial;
  });
  return `SCH-${missionCode}-${year}-${String(serial).padStart(5, "0")}`;
}
