import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PublishToggle } from "./_components/PublishToggle";
import { redirect } from "next/navigation";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";

const CATEGORY_LABELS: Record<string, string> = {
  SPIRITUAL: "Spiritual",
  PHYSICAL: "Physical",
  MENTAL: "Mental",
  SOCIAL: "Social",
};

const WINDOW_STATE_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ADVERTISING: "bg-blue-100 text-blue-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

const MAX_ACTIVE = 5;

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; category?: string; q?: string }>;
}) {
  const user = await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);

  if (user.role === "MAIN_DIRECTOR" || user.role === "SECRETARY" || user.role === "ASSOCIATE_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed) redirect("/dashboard/director");
  }

  const { year, category, q } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const search = q?.trim() ?? "";

  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      ...(category ? { category: category as any } : {}),
      ...(yearNum
        ? {
            startDate: {
              gte: new Date(`${yearNum}-01-01`),
              lt: new Date(`${yearNum + 1}-01-01`),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { titleBangla: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { startDate: "desc" },
    include: {
      applicationWindows: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { state: true },
      },
      _count: {
        select: {
          enrollments: { where: { deletedAt: null } },
        },
      },
    },
  });

  // All program years for the year filter
  const allYears = [
    ...new Set(
      (await prisma.trainingProgram.findMany({ where: { deletedAt: null }, select: { startDate: true } }))
        .map((p) => new Date(p.startDate).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  const activeCount = programs.filter((p) => p.isPublished).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Training Programs
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {activeCount} of {MAX_ACTIVE} active programs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Active program quota bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: MAX_ACTIVE }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-6 rounded-sm ${i < activeCount ? "bg-teal-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {MAX_ACTIVE - activeCount} slot
              {MAX_ACTIVE - activeCount !== 1 ? "s" : ""} available
            </span>
          </div>
          <PrintButton label="Print" />
          <Link
            href="/dashboard/director/programs/new"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors print:hidden"
          >
            + New Program
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search program name or code…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-[200px]"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All categories</option>
          {["SPIRITUAL", "PHYSICAL", "MENTAL", "SOCIAL"].map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {allYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(category || year || search) && (
          <Link
            href="/dashboard/director/programs"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Active limit warning */}
      {activeCount >= MAX_ACTIVE && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have reached the maximum of {MAX_ACTIVE} active programs.
          Unpublish a program to activate another.
        </div>
      )}

      {/* Programs list */}
      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No programs yet.</p>
          <Link
            href="/dashboard/director/programs/new"
            className="mt-2 inline-block text-xs text-teal-600 hover:underline"
          >
            Create your first program →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program, idx) => {
            const latestWindow = program.applicationWindows[0];
            const windowState = latestWindow?.state ?? null;

            return (
              <div
                key={program.id}
                className={`rounded-xl border bg-white p-5 transition-all hover:shadow-sm ${
                  program.isPublished ? "border-teal-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="hidden print:inline-block flex-shrink-0 w-6 text-xs font-semibold text-gray-500">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">
                        {program.code}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {CATEGORY_LABELS[program.category] ?? program.category}
                      </span>
                      {windowState && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${WINDOW_STATE_COLORS[windowState]}`}
                        >
                          Window: {windowState}
                        </span>
                      )}
                      {program.isPublished && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                          Active
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {program.title}
                    </h2>
                    {program.titleBangla && (
                      <p className="text-xs text-gray-500">
                        {program.titleBangla}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>
                        {new Date(program.startDate).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                        {" — "}
                        {new Date(program.endDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {program.location && <span>📍 {program.location}</span>}
                      <span>Target: {program.targetIntake} trainees</span>
                      <span>Enrolled: {program._count.enrollments}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <PublishToggle
                      programId={program.id}
                      isPublished={program.isPublished}
                      canPublish={
                        activeCount < MAX_ACTIVE || program.isPublished
                      }
                      hasOpenWindow={windowState === "OPEN"}
                    />
                    <Link
                      href={`/dashboard/director/programs/${program.id}`}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
