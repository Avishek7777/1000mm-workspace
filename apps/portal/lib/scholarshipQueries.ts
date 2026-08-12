import { prisma } from "@1000mm/db";

/** Fields every scholarship view needs. Shared so the list pages cannot drift. */
export const scholarshipCardSelect = {
  id: true,
  referenceNumber: true,
  status: true,
  submittedAt: true,
  planningToStudy: true,
  subject: true,
  collegeName: true,
  yearlyFees: true,
  approvedAmount: true,
  lmdDecisionNote: true,
  lmdDecisionAt: true,
  lmdMinutesKey: true,
  lmdMinutesName: true,
  udDecisionNote: true,
  udDecisionAt: true,
  lmdReviewer: { select: { fullName: true } },
  udReviewer: { select: { fullName: true } },
  mission: { select: { code: true, name: true } },
  missionary: { select: { fullName: true } },
} as const;

/**
 * `missionId` scopes to one mission (the LMD's). `statuses` narrows to a
 * review stage — the UD only ever acts on LMD_SUGGESTED, but still wants to
 * see what they have already decided.
 */
export async function loadScholarships(opts: {
  missionId?: string;
  statuses?: string[];
}) {
  return prisma.scholarshipRequest.findMany({
    where: {
      deletedAt: null,
      ...(opts.missionId ? { missionId: opts.missionId } : {}),
      ...(opts.statuses?.length ? { status: { in: opts.statuses as never } } : {}),
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    select: scholarshipCardSelect,
  });
}
