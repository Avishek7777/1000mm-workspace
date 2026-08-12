import { prisma } from "@1000mm/db";
import { requireRole } from "@/lib/auth/helpers";
import { loadFieldProjects, summariseProjects } from "@/lib/fieldProjectQueries";
import { FieldProjectBoard } from "@/app/dashboard/_components/fieldProjects/FieldProjectBoard";
import { FieldProjectForm } from "@/app/dashboard/_components/fieldProjects/FieldProjectForm";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-[11px] tracking-wide text-gray-400 uppercase">{label}</p>
    </div>
  );
}

export default async function LmdFieldProjectsPage() {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
    select: { id: true, code: true, name: true },
  });

  if (!mission) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-lg font-semibold text-gray-900">Field Projects</h1>
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
          No mission is assigned to your account.
        </p>
      </div>
    );
  }

  const projects = await loadFieldProjects(mission.id);
  const stats = summariseProjects(projects);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Field Projects</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {mission.name} ({mission.code})
          </p>
        </div>
        <FieldProjectForm trigger="+ New Project" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Projects" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Assigned" value={stats.assigned} />
      </div>

      <FieldProjectBoard projects={projects} canEdit />
    </div>
  );
}
