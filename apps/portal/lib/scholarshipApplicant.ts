import { prisma } from "@1000mm/db";

/**
 * Details the scholarship form fills in on the applicant's behalf.
 *
 * Date of birth is preferred from the account, falling back to the most recent
 * bio-data application — User.dateOfBirth is optional and often unset, while
 * an application always carries one. Returning null for both means the
 * applicant has to type it, rather than being shown an empty locked field.
 */
export async function loadScholarshipApplicant(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      homeMissionId: true,
      homeMission: { select: { code: true, name: true } },
    },
  });
  if (!user) return null;

  let dateOfBirth = user.dateOfBirth;
  if (!dateOfBirth) {
    const application = await prisma.application.findFirst({
      where: { applicantId: userId, deletedAt: null, applicantDateOfBirth: { not: undefined } },
      orderBy: { submittedAt: "desc" },
      select: { applicantDateOfBirth: true },
    });
    dateOfBirth = application?.applicantDateOfBirth ?? null;
  }

  return { ...user, dateOfBirth };
}
