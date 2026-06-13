import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { MissionCard } from "./_components/MissionCard";

export default async function MissionsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const missions = await prisma.localMission.findMany({
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
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Missions</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          4 local missions · Bangladesh Adventist Union Mission
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}
