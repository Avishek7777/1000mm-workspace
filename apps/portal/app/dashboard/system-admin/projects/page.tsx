import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { ProjectCard } from "./_components/ProjectCard";
import { AddProjectButton } from "./_components/AddProjectButton";

export default async function ProjectsAdminPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Website Projects
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""} ·
            displayed on the public website
          </p>
        </div>
        <AddProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No projects yet. Add the first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
