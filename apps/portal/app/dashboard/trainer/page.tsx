import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma as db } from "@1000mm/db";
import {
  BookOpen,
  Users,
  MapPin,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Trainer Dashboard" };

export default async function TrainerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER") redirect("/dashboard");

  const trainerId = session.user.id;

  // Fetch all programs this trainer is assigned to (via topics)
  const programs = await db.trainingProgram.findMany({
    where: {
      deletedAt: null,
      topics: { some: { trainerId, deletedAt: null } },
    },
    include: {
      topics: {
        where: { trainerId, deletedAt: null },
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      },
      enrollments: {
        where: { deletedAt: null },
        select: {
          id: true,
          attendanceConfirmed: true,
          trainee: {
            select: {
              id: true,
              fullName: true,
              homeMission: { select: { code: true } },
            },
          },
        },
      },
      applicationWindows: {
        where: { deletedAt: null },
        orderBy: { applicationCloseDate: "desc" },
        take: 1,
        select: {
          state: true,
          applicationCloseDate: true,
          applicationOpenDate: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Summary totals
  const totalPrograms = programs.length;
  const totalTrainees = programs.reduce(
    (sum, p) => sum + p.enrollments.length,
    0,
  );
  const confirmedTrainees = programs.reduce(
    (sum, p) => sum + p.enrollments.filter((e) => e.attendanceConfirmed).length,
    0,
  );

  const now = new Date();

  function programStatus(p: (typeof programs)[0]) {
    if (p.endDate < now)
      return { label: "Completed", color: "bg-slate-100 text-slate-600" };
    if (p.startDate <= now && p.endDate >= now)
      return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
    return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your assigned training programs.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Programs"
          value={totalPrograms}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          icon={Users}
          label="Total Trainees"
          value={totalTrainees}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={CalendarDays}
          label="Confirmed"
          value={confirmedTrainees}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </div>

      {/* Programs list */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-800">
          Your Programs
        </h2>

        {programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              You haven't been assigned to any programs yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => {
              const { label, color } = programStatus(program);
              const enrolled = program.enrollments.length;
              const confirmed = program.enrollments.filter(
                (e) => e.attendanceConfirmed,
              ).length;

              // Mission breakdown
              const missionCounts = program.enrollments.reduce<
                Record<string, number>
              >((acc, e) => {
                const code = e.trainee.homeMission?.code ?? "—";
                acc[code] = (acc[code] ?? 0) + 1;
                return acc;
              }, {});

              return (
                <div
                  key={program.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: program info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
                        >
                          {label}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {program.category.charAt(0) +
                            program.category.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {program.code}
                        </span>
                      </div>

                      <h3 className="mt-2 truncate text-base font-semibold text-gray-900">
                        {program.title}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(program.startDate)} –{" "}
                          {formatDate(program.endDate)}
                        </span>
                        {program.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {program.location}
                          </span>
                        )}
                      </div>

                      {/* Trainee stats row */}
                      {/* Topic pills */}
                      {program.topics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {program.topics.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-medium text-violet-700"
                            >
                              {t.title}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">
                            {enrolled}
                          </span>
                          <span className="ml-1 text-gray-500">enrolled</span>
                        </span>
                        <span className="text-gray-700">
                          <span className="font-semibold text-emerald-700">
                            {confirmed}
                          </span>
                          <span className="ml-1 text-gray-500">confirmed</span>
                        </span>
                      </div>

                      {/* Mission breakdown pills */}
                      {Object.keys(missionCounts).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {Object.entries(missionCounts).map(
                            ([code, count]) => (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                              >
                                <span className="font-medium">{code}</span>
                                <span className="text-gray-400">·</span>
                                <span>{count}</span>
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: link to trainees */}
                    <Link
                      href="/dashboard/trainees"
                      className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      Trainees
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Progress bar: confirmed / enrolled */}
                  {enrolled > 0 && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                        <span>Attendance confirmed</span>
                        <span>{Math.round((confirmed / enrolled) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${(confirmed / enrolled) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg p-2 ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
