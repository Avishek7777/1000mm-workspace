import { prisma } from "@1000mm/db";

/**
 * Who may export scholarship data, and how much of it.
 *
 * An LMD sees their own mission. MAIN_DIRECTOR and SYSTEM_ADMIN see every
 * mission. Anyone else is refused — these records carry NIDs, family details
 * and financial figures.
 */
export async function resolveScholarshipExportScope(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, fullName: true },
  });
  if (!user) return { error: "Unauthorized" as const, status: 401 };

  if (user.role === "LOCAL_DIRECTOR") {
    const mission = await prisma.localMission.findFirst({
      where: { directorId: user.id },
      select: { id: true, code: true, name: true },
    });
    if (!mission) return { error: "No mission assigned." as const, status: 403 };
    return { user, missionId: mission.id, scopeLabel: `${mission.name} (${mission.code})` };
  }

  if (["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)) {
    return { user, missionId: undefined, scopeLabel: "All missions" };
  }

  return { error: "Forbidden" as const, status: 403 };
}
