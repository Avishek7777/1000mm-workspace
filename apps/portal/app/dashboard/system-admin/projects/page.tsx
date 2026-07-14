import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { ProjectCard } from "./_components/ProjectCard";
import { AddProjectButton } from "./_components/AddProjectButton";

const FILTERS = ["All", "Active", "Upcoming", "Completed", "Drafts"] as const;
type Filter = (typeof FILTERS)[number];

// The public website that displays these projects (for preview links).
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function ProjectsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireRole(["SYSTEM_ADMIN"]);

  const { filter: rawFilter } = await searchParams;
  const filter: Filter = (FILTERS as readonly string[]).includes(rawFilter ?? "")
    ? (rawFilter as Filter)
    : "All";

  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const counts: Record<Filter, number> = {
    All: projects.length,
    Active: projects.filter((p) => p.status === "Active" && p.isPublished).length,
    Upcoming: projects.filter((p) => p.status === "Upcoming" && p.isPublished).length,
    Completed: projects.filter((p) => p.status === "Completed" && p.isPublished).length,
    Drafts: projects.filter((p) => !p.isPublished).length,
  };

  const visible = projects.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Drafts") return !p.isPublished;
    return p.status === filter && p.isPublished;
  });

  const publishedCount = projects.filter((p) => p.isPublished).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Website Projects
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {publishedCount} live on the website · {counts.Drafts} draft
            {counts.Drafts !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${SITE_URL}/current-projects`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            View Live Page ↗
          </a>
          <AddProjectButton />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "All" ? "?" : `?filter=${f}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "border-teal-400 bg-teal-50 text-teal-800"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {f}
            <span className="ml-1 text-[10px] text-gray-400">{counts[f]}</span>
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            {filter === "All"
              ? "No projects yet. Add the first one."
              : `No ${filter.toLowerCase()} projects.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} siteUrl={SITE_URL} />
          ))}
        </div>
      )}
    </div>
  );
}
