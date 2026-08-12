import { requireRole } from "@/lib/auth/helpers";
import { loadFieldProjects, summariseProjects } from "@/lib/fieldProjectQueries";
import { FieldProjectBoard } from "@/app/dashboard/_components/fieldProjects/FieldProjectBoard";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-[11px] tracking-wide text-gray-400 uppercase">{label}</p>
    </div>
  );
}

/**
 * Oversight view: every mission's field projects in one place. Editable —
 * these roles supervise the LMDs and can correct a project directly.
 */
export default async function DirectorFieldProjectsPage() {
  await requireRole([
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "SYSTEM_ADMIN",
  ]);

  const projects = await loadFieldProjects();
  const stats = summariseProjects(projects);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Field Projects</h1>
        <p className="mt-0.5 text-sm text-gray-500">All missions</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Projects" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Assigned" value={stats.assigned} />
      </div>

      <FieldProjectBoard projects={projects} canEdit showMission />
    </div>
  );
}
