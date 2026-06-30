import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { MissionCard } from "./_components/MissionCard";
import { AddMissionButton } from "./_components/AddMissionModal";

export default async function MissionsPage() {
  const user = await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const [missions, lmdUsers] = await Promise.all([
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      include: {
        director: { select: { id: true, fullName: true, email: true } },
        _count: {
          select: {
            users: { where: { deletedAt: null, isActive: true } },
            applications: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "LOCAL_DIRECTOR", deletedAt: null, isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Missions</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {missions.length} local mission{missions.length !== 1 ? "s" : ""} · Bangladesh Adventist Union Mission
          </p>
        </div>
        {user.role === "SYSTEM_ADMIN" && <AddMissionButton lmdUsers={lmdUsers} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} lmdUsers={lmdUsers} />
        ))}
      </div>
    </div>
  );
}
